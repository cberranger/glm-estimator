// Preload script to disable native resolver before webpack loads
// This must be loaded via NODE_OPTIONS="--require ./disable-native-resolver.js"

const fs = require('fs');
const path = require('path');

// Check if we're on exFAT
let isExFAT = false;
try {
  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    const result = execSync('wmic logicaldisk where "DeviceID=\'E:\'" get FileSystem', { encoding: 'utf8' });
    isExFAT = result.includes('exFAT');
  }
} catch (e) {}

if (isExFAT) {
  console.log('[preload] exFAT detected, patching fs.readlink...');
  
  // Monkey-patch fs.readlink to handle exFAT + bracketed paths
  const originalReadlink = fs.readlink;
  const originalReadlinkSync = fs.readlinkSync;
  
  function hasBracketedPath(filepath) {
    return /\[[^\]]+\]/.test(filepath);
  }
  
  fs.readlinkSync = function(filepath, options) {
    const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
    
    // On exFAT, immediately return EINVAL for any readlink call
    // This prevents the native resolver from causing issues
    if (hasBracketedPath(filepathStr)) {
      const error = new Error('Not a symbolic link');
      error.code = 'EINVAL';
      throw error;
    }
    
    try {
      return originalReadlinkSync.call(originalReadlinkSync, filepath, options);
    } catch (e) {
      // Convert EISDIR to EINVAL (exFAT returns wrong error code)
      if (e.code === 'EISDIR') {
        const error = new Error('Not a symbolic link');
        error.code = 'EINVAL';
        throw error;
      }
      throw e;
    }
  };
  
  fs.readlink = function(...args) {
    let filepath, callback, options;
    
    if (typeof args[1] === 'function') {
      filepath = args[0];
      callback = args[1];
    } else {
      filepath = args[0];
      options = args[1];
      callback = args[2];
    }
    
    if (!callback) {
      return originalReadlink.apply(originalReadlink, args);
    }
    
    const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
    
    if (hasBracketedPath(filepathStr)) {
      const error = new Error('Not a symbolic link');
      error.code = 'EINVAL';
      return process.nextTick(() => callback(error));
    }
    
    originalReadlink.call(originalReadlink, filepath, options || callback, (err, result) => {
      if (err && err.code === 'EISDIR') {
        const error = new Error('Not a symbolic link');
        error.code = 'EINVAL';
        return callback(error);
      }
      callback(err, result);
    });
  };
  
  // Also patch fs.promises.readlink
  if (fs.promises && fs.promises.readlink) {
    const originalPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function(filepath, options) {
      const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
      
      if (hasBracketedPath(filepathStr)) {
        const error = new Error('Not a symbolic link');
        error.code = 'EINVAL';
        throw error;
      }
      
      try {
        return await originalPromisesReadlink.call(originalPromisesReadlink, filepath, options);
      } catch (e) {
        if (e.code === 'EISDIR') {
          const error = new Error('Not a symbolic link');
          error.code = 'EINVAL';
          throw error;
        }
        throw e;
      }
    };
  }
  
  console.log('[preload] fs.readlink patched successfully');
}
