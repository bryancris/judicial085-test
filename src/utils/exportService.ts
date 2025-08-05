
import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  clientId: string;
  caseId?: string;
  format: 'pdf' | 'word';
  sections?: string[];
}

export interface QuickConsultExportOptions {
  sessionId: string;
  format: 'pdf' | 'word';
}

export const exportCaseAnalysis = async (options: ExportOptions): Promise<void> => {
  try {
    console.log('Starting export with options:', options);

    // Use server-side generation for both PDF and Word formats
    await generateServerSideDocument(options);

  } catch (error: any) {
    console.error('Export error:', error);
    throw new Error(error.message || 'Failed to export case analysis');
  }
};

const generateServerSideDocument = async (options: ExportOptions): Promise<void> => {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required for export');
  }

  console.log(`Generating ${options.format.toUpperCase()} using server-side approach...`);

  // Use direct fetch for server-side generation
  const response = await fetch(`https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/export-case-analysis`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDEyNjIsImV4cCI6MjA2MTc3NzI2Mn0._GXOu4i6i7iITULVAWiyZnY5G7AWcuuM2A9_t5C4bUI'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Server-side export error:', errorText);
    throw new Error(`Export failed: ${response.status} - ${errorText}`);
  }

  // Handle the response as a blob for binary data
  const blob = await response.blob();
  
  if (blob.size === 0) {
    throw new Error('Received empty file from export service');
  }

  console.log(`Server-side ${options.format.toUpperCase()} export successful, file size:`, blob.size);
  downloadFile(blob, generateFilename(options));
};

const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const exportQuickConsult = async (options: QuickConsultExportOptions): Promise<void> => {
  try {
    console.log('Starting Quick Consult export with options:', options);

    // Use server-side generation for document
    await generateServerSideQuickConsultDocument(options);

  } catch (error: any) {
    console.error('Quick Consult export error:', error);
    throw new Error(error.message || 'Failed to export quick consult session');
  }
};

const generateServerSideQuickConsultDocument = async (options: QuickConsultExportOptions): Promise<void> => {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Authentication required for export');
  }

  console.log(`Generating ${options.format.toUpperCase()} for Quick Consult using server-side approach...`);

  // Use direct fetch for server-side generation
  const response = await fetch(`https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/export-quick-consult`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDEyNjIsImV4cCI6MjA2MTc3NzI2Mn0._GXOu4i6i7iITULVAWiyZnY5G7AWcuuM2A9_t5C4bUI'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Server-side Quick Consult export error:', errorText);
    throw new Error(`Export failed: ${response.status} - ${errorText}`);
  }

  // Handle the response as a blob for binary data
  const blob = await response.blob();
  
  if (blob.size === 0) {
    throw new Error('Received empty file from export service');
  }

  console.log(`Server-side ${options.format.toUpperCase()} Quick Consult export successful, file size:`, blob.size);
  downloadFile(blob, generateQuickConsultFilename(options));
};

const generateQuickConsultFilename = (options: QuickConsultExportOptions): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = options.format === 'pdf' ? 'pdf' : 'docx';
  return `QuickConsult_${timestamp}.${extension}`;
};

const generateFilename = (options: ExportOptions): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = options.format === 'pdf' ? 'pdf' : 'docx';
  return `CaseAnalysis_${timestamp}.${extension}`;
};
