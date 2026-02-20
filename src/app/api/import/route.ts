import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Check multiple possible locations for JSON files
function findJsonFiles(): { uploadDir: string; exists: boolean; files: Array<{ name: string; path: string; size: number }> } {
  const possibleDirs = [
    path.join(process.cwd(), 'db', 'json'),
    path.join(process.cwd(), 'upload'),
    '/home/z/my-project/db/json',
    '/home/z/my-project/upload',
  ];
  
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      // Check for .json files
      let files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          size: fs.statSync(path.join(dir, f)).size,
        }));
      
      // Also check for .json.txt files
      const txtFiles = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json.txt'))
        .map(f => ({
          name: f,
          path: path.join(dir, f),
          size: fs.statSync(path.join(dir, f)).size,
        }));
      
      files = [...files, ...txtFiles];
      
      if (files.length > 0) {
        return {
          uploadDir: dir,
          exists: true,
          files,
        };
      }
    }
  }
  
  // Return the first existing directory even if empty, or default
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      return {
        uploadDir: dir,
        exists: true,
        files: [],
      };
    }
  }
  
  return {
    uploadDir: path.join(process.cwd(), 'db', 'json'),
    exists: false,
    files: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Find JSON files
    const status = findJsonFiles();
    
    if (!status.exists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No data directory found. Please create ./db/json/ directory and add JSON files.',
        },
        { status: 404 }
      );
    }
    
    if (status.files.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No JSON files found. Please add .json files to ./db/json/ directory.',
        },
        { status: 400 }
      );
    }
    
    // Run the import script
    const scriptPath = path.join(process.cwd(), 'scripts', 'import-json-data.ts');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Import script not found at scripts/import-json-data.ts',
        },
        { status: 500 }
      );
    }
    
    try {
      const { stdout, stderr } = await execAsync(
        `npx tsx "${scriptPath}"`,
        {
          timeout: 300000, // 5 minutes
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          cwd: process.cwd(),
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Import completed successfully',
        filesProcessed: status.files.length,
        output: stdout,
        errors: stderr ? [stderr] : [],
      });
    } catch (execError: unknown) {
      const err = execError as { stdout?: string; stderr?: string; message?: string };
      return NextResponse.json({
        success: false,
        message: 'Import encountered errors',
        output: err.stdout || '',
        errors: [err.stderr || err.message || 'Unknown error'],
      }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Import API error:', error);
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: 'Failed to run import', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = findJsonFiles();
    
    return NextResponse.json({
      uploadDir: status.uploadDir,
      exists: status.exists,
      files: status.files,
      totalFiles: status.files.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to list files', details: err.message },
      { status: 500 }
    );
  }
}
