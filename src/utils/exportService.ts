
import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  clientId: string;
  caseId?: string;
  format: 'pdf' | 'word';
  sections?: string[];
}

export const exportCaseAnalysis = async (options: ExportOptions): Promise<void> => {
  try {
    console.log('Starting export with options:', options);

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required for export');
    }

    // Use direct fetch instead of supabase.functions.invoke to handle binary data
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
      console.error('Export function error:', errorText);
      throw new Error(`Export failed: ${response.status} - ${errorText}`);
    }

    // Handle the response as a blob for binary data
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Received empty file from export service');
    }

    console.log('Export successful, file size:', blob.size);
    downloadFile(blob, generateFilename(options));

  } catch (error: any) {
    console.error('Export error:', error);
    throw new Error(error.message || 'Failed to export case analysis');
  }
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

const generateFilename = (options: ExportOptions): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = options.format === 'pdf' ? 'pdf' : 'docx';
  return `CaseAnalysis_${timestamp}.${extension}`;
};
