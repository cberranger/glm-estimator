/**
 * Monkey-patch fs.readlink to handle non-symlink files gracefully on exFAT
 * This MUST be loaded before Next.js/webpack initializes
 * 
 * Usage: node -r ./scripts/fs-patch.js node_modules/.bin/next build
 * 
 * On exFAT filesystems, readlink can return EISDIR for regular files.
 * Since exFAT doesn't support symlinks, we just pretend everything is not a symlink.
 */

const fs = require('fs');
const path = require('path');

// Check if we're on exFAT
const isExFAT = (() => {
  try {
    // On Windows, check if the drive is exFAT
    if (process.platform === 'win32') {
      const { execSync } = require('child_process');
      const result = execSync('wmic logicaldisk where "DeviceID=\'E:\'" get FileSystem', { encoding: 'utf8' });
      return result.includes('exFAT');
    }
  } catch (e) {
    // Assume exFAT if we can't check
    return true;
  }
  return false;
})();

const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

// Sync version fix
fs.readlinkSync = function(filepath, options) {
  const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
  
  // On exFAT, no files are symlinks - just throw EINVAL
  if (isExFAT) {
    const error = new Error('Not a symbolic link');
    error.code = 'EINVAL';
    error.errno = -22;
    throw error;
  }
  
  // On other filesystems, check properly
  try {
    const stats = fs.lstatSync(filepathStr);
    if (!stats.isSymbolicLink()) {
      const error = new Error('Not a symbolic link');
      error.code = 'EINVAL';
      error.errno = -22;
      throw error;
    }
  } catch (e) {
    if (e.code === 'EINVAL') throw e;
  }
  
  return originalReadlinkSync.call(originalReadlinkSync, filepath, options);
};

// Async version fix
fs.readlink = function(...args) {
  let filepath;
  let callback;
  let options;
  
  if (typeof args[1] === 'function') {
    filepath = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
    callback = args[1];
  } else {
    filepath = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
    options = args[1];
    callback = args[2];
  }
  
  if (!callback) {
    return originalReadlink.apply(originalReadlink, args);
  }
  
  // On exFAT, no files are symlinks - just return EINVAL
  if (isExFAT) {
    const error = new Error('Not a symbolic link');
    error.code = 'EINVAL';
    error.errno = -22;
    return process.nextTick(() => callback(error));
  }
  
  // On other filesystems, check properly
  fs.lstat(filepath, (err, stats) => {
    if (err) {
      return originalReadlink.apply(originalReadlink, args);
    }
    
    if (!stats.isSymbolicLink()) {
      const error = new Error('Not a symbolic link');
      error.code = 'EINVAL';
      error.errno = -22;
      return callback(error);
    }
    
    return originalReadlink.apply(originalReadlink, args);
  });
};

console.log('[fs-patch] Applied fs.readlink monkey-patch for exFAT compatibility (exFAT detected:', isExFAT, ')');
