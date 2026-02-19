import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const uploadDir = body.uploadDir || '/home/z/my-project/upload';
    
    // Check if upload directory exists
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json(
        { error: 'Upload directory not found' },
        { status: 404 }
      );
    }
    
    // Find JSON files
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.json.txt'));
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No JSON files found in upload directory' },
        { status: 400 }
      );
    }
    
    // Run the import script
    const scriptPath = path.join(process.cwd(), 'scripts', 'import-estimating-data.ts');
    
    try {
      const { stdout, stderr } = await execAsync(
        `npx tsx "${scriptPath}" "${uploadDir}"`,
        {
          timeout: 300000, // 5 minutes
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Import completed successfully',
        filesProcessed: files.length,
        output: stdout,
        errors: stderr ? [stderr] : [],
      });
    } catch (execError: unknown) {
      const err = execError as { stdout?: string; stderr?: string; message?: string };
      // Even if there's an error, check if the import was successful
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
      { error: 'Failed to run import', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const uploadDir = '/home/z/my-project/upload';
  
  try {
    // Check if upload directory exists
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({
        uploadDir,
        exists: false,
        files: [],
      });
    }
    
    // List JSON files
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.endsWith('.json.txt'))
      .map(f => ({
        name: f,
        path: path.join(uploadDir, f),
        size: fs.statSync(path.join(uploadDir, f)).size,
      }));
    
    return NextResponse.json({
      uploadDir,
      exists: true,
      files,
      totalFiles: files.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to list files', details: err.message },
      { status: 500 }
    );
  }
}
