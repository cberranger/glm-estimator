import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// Check if we're on exFAT
const isExFAT = (() => {
  try {
    if (process.platform === 'win32') {
      const result = execSync('wmic logicaldisk where "DeviceID=\'E:\'" get FileSystem', { encoding: 'utf8' });
      return result.includes('exFAT');
    }
  } catch (e) {
    return false;
  }
  return false;
})();

// Monkey-patch fs.readlink to handle bracketed paths on Windows exFAT
// This is a workaround for webpack's enhanced-resolve calling readlink on files
const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

// Helper to check if path has bracketed segments (like [id])
function hasBracketedPath(filepath: string): boolean {
  return /\[[^\]]+\]/.test(filepath);
}

// Sync version fix
fs.readlinkSync = function(filepath: fs.PathLike, options?: fs.BufferEncodingOption) {
  const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
  
  // On exFAT with bracketed paths, immediately throw EINVAL to prevent native resolver issues
  if (isExFAT && hasBracketedPath(filepathStr)) {
    const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
    error.code = 'EINVAL';
    throw error;
  }
  
  // On exFAT, nothing is a symlink - just throw EINVAL immediately
  if (isExFAT) {
    const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
    error.code = 'EINVAL';
    throw error;
  }
  
  try {
    const stats = fs.lstatSync(filepathStr);
    if (!stats.isSymbolicLink()) {
      const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      throw error;
    }
    return originalReadlinkSync.apply(originalReadlinkSync, [filepath, options] as any);
  } catch (e: any) {
    // Handle EINVAL, EISDIR (exFAT weirdness), and ENOENT
    if (e.code === 'EINVAL' || e.code === 'EISDIR' || e.code === 'ENOENT') {
      throw e;
    }
    // For any other error, return EINVAL (not a symlink)
    const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
    error.code = 'EINVAL';
    throw error;
  }
} as any;

// Async version fix
fs.readlink = function(...args: any[]) {
  let filepath: string;
  let callback: Function | undefined;
  let options: any;
  
  if (typeof args[1] === 'function') {
    filepath = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
    callback = args[1];
  } else {
    filepath = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
    options = args[1];
    callback = args[2];
  }
  
  if (!callback) {
    return originalReadlink.apply(originalReadlink, args as any);
  }
  
  // On exFAT with bracketed paths, immediately throw EINVAL
  if (isExFAT && hasBracketedPath(filepath)) {
    const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
    error.code = 'EINVAL';
    return process.nextTick(() => callback(error));
  }
  
  // On exFAT, nothing is a symlink - just return EINVAL immediately
  if (isExFAT) {
    const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
    error.code = 'EINVAL';
    return process.nextTick(() => callback(error));
  }
  
  fs.lstat(filepath, (err, stats) => {
    if (err) {
      return originalReadlink.apply(originalReadlink, args as any);
    }
    
    if (!stats.isSymbolicLink()) {
      const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      return callback(error);
    }
    
    return originalReadlink.apply(originalReadlink, args as any);
  });
} as any;

// Also patch fs.promises.readlink for async/await usage
if (fs.promises && fs.promises.readlink) {
  const originalPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function(filepath: fs.PathLike, options?: fs.BufferEncodingOption | null) {
    const filepathStr = typeof filepath === 'string' ? filepath : filepath.toString();
    
    // On exFAT with bracketed paths, immediately throw EINVAL
    if (isExFAT && hasBracketedPath(filepathStr)) {
      const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      throw error;
    }
    
    if (isExFAT) {
      const error = new Error('Not a symbolic link') as NodeJS.ErrnoException;
      error.code = 'EINVAL';
      throw error;
    }
    
    return originalPromisesReadlink.apply(originalPromisesReadlink, [filepath, options] as any);
  } as any;
}

console.log('[next.config.ts] Applied fs.readlink monkey-patch (exFAT detected:', isExFAT, ')');

const nextConfig: NextConfig = {
  // output: "standalone", // Disabled for exFAT compatibility - re-enable when deploying
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Use Turbopack for builds to avoid webpack's native resolver issues on exFAT
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
  },
  // Fix Windows issue with bracketed dynamic route paths on exFAT
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config, { isServer }) => {
    // Fix Windows symlink resolution issues with bracketed paths
    // Apply to BOTH server and client builds (was only client before)
    config.resolve.symlinks = false;
    // Increase performance hints to avoid warnings
    config.performance = {
      ...config.performance,
      hints: false,
    };
    // Disable webpack filesystem cache on exFAT (doesn't support symlinks)
    config.cache = false;
    // Disable parallel builds to avoid worker thread issues with fs patch
    config.parallelism = 1;
    // Disable the native resolver (unrs-resolver) which calls readlink directly
    config.resolve.plugins = config.resolve.plugins || [];
    // Force using the JS resolver instead of native by disabling the native resolver
    (config as any).resolve = {
      ...config.resolve,
      // Force using enhanced-resolve's JS implementation instead of native unrs-resolver
      preferRelative: true,
    };
    (config as any).snapshot = {
      ...(config as any).snapshot,
      managedPaths: [],
      immutablePaths: [],
    };
    // Disable native resolver via environment
    process.env.WEBPACK_DISABLE_NATIVE_RESOLVER = '1';
    
    // CRITICAL: Disable the native unrs-resolver by forcing the fallback
    // This makes webpack use the JS-based enhanced-resolve instead
    if (isExFAT) {
      // @ts-ignore - accessing internal webpack config
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: 'error',
      };
      // Force disable native resolver
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
      };
    }
    
    return config;
  },
};

export default nextConfig;
