/**
 * Universal Error Shipper
 * 
 * Drop this file into any project as `scripts/ship-errors.js`
 * Run: node scripts/ship-errors.js
 * 
 * Or add to package.json:
 *   "scripts": { "dev": "node scripts/ship-errors.js & next dev" }
 * 
 * Environment variables:
 *   PROJECT_NAME - Required: unique project identifier
 *   LOKI_URL - Optional: Loki server URL (default: http://192.168.1.10:3100)
 *   DESIGN_DOCS - Optional: path to design docs for agent context
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  PROJECT: process.env.PROJECT_NAME || process.env.npm_package_name || path.basename(process.cwd()),
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  LOKI_URL: process.env.LOKI_URL || 'http://192.168.1.10:3100/loki/api/v1/push',
  WORKSPACE: process.cwd(),
  DOCS: findProjectDocs(),
  
  // Log file patterns to watch
  LOG_PATTERNS: [
    'logs/error.log',
    'logs/errors.log',
    'error.log',
    'errors.log',
    'backend/logs/error.log',
    'frontend/logs/error.log',
  ],
  
  BATCH_INTERVAL: 5000,
};

function findProjectDocs() {
  const docs = {};
  const workspace = process.cwd();
  
  // Find AGENT_RULES.md
  const rulesCandidates = ['AGENT_RULES.md'];
  for (const c of rulesCandidates) {
    if (fs.existsSync(path.join(workspace, c))) {
      docs.agent_rules = c;
      break;
    }
  }
  
  // Find AGENTS.md (may be in subdirectories)
  const agentsCandidates = ['AGENTS.md', 'backend/AGENTS.md', 'frontend/AGENTS.md'];
  for (const c of agentsCandidates) {
    if (fs.existsSync(path.join(workspace, c))) {
      docs.agents = c;
      break;
    }
  }
  
  // Find DESIGN.md (may be in subdirectories)
  const designCandidates = ['DESIGN.md', 'docs/DESIGN.md', 'backend/DESIGN.md', 'frontend/DESIGN.md'];
  for (const c of designCandidates) {
    if (fs.existsSync(path.join(workspace, c))) {
      docs.design = c;
      break;
    }
  }
  
  // Find TASKS.md
  const tasksCandidates = ['TASKS.md', 'backend/TASKS.md', 'frontend/TASKS.md'];
  for (const c of tasksCandidates) {
    if (fs.existsSync(path.join(workspace, c))) {
      docs.tasks = c;
      break;
    }
  }
  
  return docs;
}

// Legacy function for compatibility
function findDesignDocs() {
  return CONFIG.DOCS.design || CONFIG.DOCS.agents || null;
}

function pushToLoki(streams) {
  return new Promise((resolve, reject) => {
    if (streams.length === 0) return resolve();
    
    const body = JSON.stringify({ streams });
    const url = new URL(CONFIG.LOKI_URL);
    
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => res.statusCode < 300 ? resolve() : reject(new Error(`Loki ${res.statusCode}`)));
    });
    
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Global error handlers
function setupGlobalHandlers() {
  const labels = {
    job: 'app-errors',
    project: CONFIG.PROJECT,
    environment: CONFIG.ENVIRONMENT,
    source: 'backend',
    workspace: CONFIG.WORKSPACE,
  };
  
  // Add doc paths for agent context
  if (CONFIG.DOCS.agent_rules) labels.doc_agent_rules = CONFIG.DOCS.agent_rules;
  if (CONFIG.DOCS.agents) labels.doc_agents = CONFIG.DOCS.agents;
  if (CONFIG.DOCS.design) labels.doc_design = CONFIG.DOCS.design;
  if (CONFIG.DOCS.tasks) labels.doc_tasks = CONFIG.DOCS.tasks;
  
  // Uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('[error-shipper] Uncaught exception:', error.message);
    
    const stream = {
      stream: { ...labels, type: 'uncaught_exception' },
      values: [[(Date.now() * 1000000).toString(), JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })]]
    };
    
    try { await pushToLoki([stream]); } catch (e) { console.error('[error-shipper] Failed to ship:', e.message); }
    
    // Let the process exit
    process.exit(1);
  });
  
  // Unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('[error-shipper] Unhandled rejection:', reason);
    
    const stream = {
      stream: { ...labels, type: 'unhandled_rejection' },
      values: [[(Date.now() * 1000000).toString(), JSON.stringify({
        message: String(reason),
        stack: reason?.stack || '',
        timestamp: new Date().toISOString()
      })]]
    };
    
    try { await pushToLoki([stream]); } catch (e) { console.error('[error-shipper] Failed to ship:', e.message); }
  });
  
  console.error(`[error-shipper] Monitoring errors for project: ${CONFIG.PROJECT}`);
}

// Watch log files
const filePositions = {};

// Patterns that indicate an ACTUAL error (not build noise)
const ERROR_INDICATORS = [
  /error/i,
  /Error/i,
  /ERROR/,
  /failed/i,
  /Failed/i,
  /FAILED/,
  /exception/i,
  /Exception/i,
  /EXCEPTION/,
  /fatal/i,
  /Fatal/i,
  /FATAL/,
  /critical/i,
  /Critical/i,
  /CRITICAL/,
  /panic/i,
  /Panic/i,
  /PANIC/,
  /bug/i,
  /crash/i,
  /Crash/i,
  /CRASH/,
  /uncaught/i,
  /Unhandled/i,
  /reject/i,
  /timeout/i,
  /Timeout/i,
  /ETIMEDOUT/,
  /ECONNREFUSED/,
  /ENOENT/,
  /EPERM/,
  /ENOSPC/,
  /TypeError/,
  /ReferenceError/,
  /SyntaxError/,
  /RangeError/,
  /URIError/,
  /EvalError/,
];

// Patterns to IGNORE (build noise, not errors)
const IGNORE_PATTERNS = [
  /Compiled successfully/i,
  /Build completed/i,
  /build complete/i,
  /npm notice/i,
  /https:\/\/cra\.link\/deployment/i,
  /webpack compiled/i,
  /Compiled with warnings/i,
  /Waiting for file changes/i,
  /server started/i,
  /Local:\s*http/i,
  /Network:\s*http/i,
  /ready in \d+/i,
  /^\s*$/,
  /^\s*https?:\/\/.*/,  // Just URLs on their own
];

function isActualError(line) {
  // Skip empty lines
  if (!line.trim()) return false;
  
  // Check if line matches any ignore pattern
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(line)) return false;
  }
  
  // Check if line contains an error indicator
  for (const pattern of ERROR_INDICATORS) {
    if (pattern.test(line)) return true;
  }
  
  // Default: not an error
  return false;
}

async function shipLogFiles() {
  const streams = [];
  const now = (Date.now() * 1000000).toString();
  
  for (const pattern of CONFIG.LOG_PATTERNS) {
    const filePath = path.join(CONFIG.WORKSPACE, pattern);
    if (!fs.existsSync(filePath)) continue;
    
    const stat = fs.statSync(filePath);
    const lastPos = filePositions[filePath] || 0;
    
    if (stat.size <= lastPos) continue;
    
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(stat.size - lastPos);
    fs.readSync(fd, buffer, 0, buffer.length, lastPos);
    fs.closeSync(fd);
    
    const content = buffer.toString('utf8');
    const lines = content.split('\n').filter(l => l.trim());
    
    // Filter to only actual errors
    const errorLines = lines.filter(isActualError);
    
    if (errorLines.length === 0) {
      filePositions[filePath] = stat.size;
      continue;
    }
    
    const labels = {
      job: 'app-errors',
      project: CONFIG.PROJECT,
      environment: CONFIG.ENVIRONMENT,
      source: pattern.includes('frontend') ? 'frontend' : pattern.includes('backend') ? 'backend' : 'runtime',
      type: 'runtime_error',
      file: pattern,
      workspace: CONFIG.WORKSPACE,
    };
    
    // Add doc paths for agent context
    if (CONFIG.DOCS.agent_rules) labels.doc_agent_rules = CONFIG.DOCS.agent_rules;
    if (CONFIG.DOCS.agents) labels.doc_agents = CONFIG.DOCS.agents;
    if (CONFIG.DOCS.design) labels.doc_design = CONFIG.DOCS.design;
    if (CONFIG.DOCS.tasks) labels.doc_tasks = CONFIG.DOCS.tasks;
    
    for (const line of errorLines) {
      streams.push({
        stream: labels,
        values: [[now, line]]
      });
    }
    
    filePositions[filePath] = stat.size;
  }
  
  if (streams.length > 0) {
    try { 
      await pushToLoki(streams); 
      console.error(`[error-shipper] Shipped ${streams.length} actual errors`); 
    } catch (e) { 
      console.error('[error-shipper] Failed to ship logs:', e.message); 
    }
  }
}

// Main
console.error(`[error-shipper] Starting error shipper for: ${CONFIG.PROJECT}`);
console.error(`[error-shipper] Environment: ${CONFIG.ENVIRONMENT}`);
console.error(`[error-shipper] Workspace: ${CONFIG.WORKSPACE}`);
console.error(`[error-shipper] Docs found: ${Object.entries(CONFIG.DOCS).map(([k,v]) => `${k}=${v}`).join(', ') || 'none'}`);

setupGlobalHandlers();

// Watch log files periodically
setInterval(shipLogFiles, CONFIG.BATCH_INTERVAL);

// Initial scan
shipLogFiles();

// Also expose a simple error reporting function for manual use
module.exports = {
  reportError: async (error, context = {}) => {
    const labels = {
      job: 'app-errors',
      project: CONFIG.PROJECT,
      environment: CONFIG.ENVIRONMENT,
      source: 'backend',
      type: 'manual_report',
      workspace: CONFIG.WORKSPACE,
    };
    
    // Add doc paths
    if (CONFIG.DOCS.agent_rules) labels.doc_agent_rules = CONFIG.DOCS.agent_rules;
    if (CONFIG.DOCS.agents) labels.doc_agents = CONFIG.DOCS.agents;
    if (CONFIG.DOCS.design) labels.doc_design = CONFIG.DOCS.design;
    if (CONFIG.DOCS.tasks) labels.doc_tasks = CONFIG.DOCS.tasks;
    
    const stream = {
      stream: labels,
      values: [[(Date.now() * 1000000).toString(), JSON.stringify({
        message: error.message || String(error),
        stack: error.stack || '',
        context,
        timestamp: new Date().toISOString()
      })]]
    };
    
    await pushToLoki([stream]);
  }
};
