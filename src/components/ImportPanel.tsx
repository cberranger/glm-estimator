'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileJson, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database,
  HardDrive,
  AlertCircle
} from 'lucide-react';

interface ImportFile {
  name: string;
  path: string;
  size: number;
}

interface ImportStatus {
  uploadDir: string;
  exists: boolean;
  files: ImportFile[];
  totalFiles: number;
}

export function ImportPanel() {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    output?: string;
    errors?: string[];
  } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/import');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching import status:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStatus();
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const runImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        // Refresh status after successful import
        setTimeout(fetchStatus, 1000);
      }
    } catch (error) {
      const err = error as Error;
      setResult({
        success: false,
        message: 'Failed to run import',
        errors: [err.message],
      });
    }
    setImporting(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Import</h2>
          <p className="text-muted-foreground">Import construction estimating data from OCR&apos;d PDF files</p>
        </div>
        <Button onClick={fetchStatus} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HardDrive className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Status
          </CardTitle>
          <CardDescription>
            Upload directory: <code className="text-xs bg-slate-100 px-1 rounded">{status?.uploadDir || '/home/z/my-project/upload'}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : status?.exists ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Upload directory found</span>
                <Badge variant="secondary">{status.totalFiles} JSON files</Badge>
              </div>

              {status.files.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {status.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={runImport} 
                  disabled={importing || status.files.length === 0}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {status.files.length} Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span>Upload directory not found. Please upload JSON files first.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Result */}
      {result && (
        <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Import {result.success ? 'Successful' : 'Failed'}
            </CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            {result.output && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-64">
                  {result.output}
                </pre>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Errors:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Import Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">1</Badge>
                <span className="font-medium">Upload Files</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Place your OCR&apos;d JSON files (.json.txt) in the upload directory
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">2</Badge>
                <span className="font-medium">Verify Files</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ensure files are detected in the list above before importing
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">3</Badge>
                <span className="font-medium">Run Import</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the Import button to process all JSON files into the database
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Expected JSON Format:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Files should contain OCR&apos;d construction estimating data</li>
              <li>Tables should have: Description, Craft@Hrs, Unit, Material, Labor, Total columns</li>
              <li>File names like &quot;1-100.json.txt&quot; will be mapped to CSI divisions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
