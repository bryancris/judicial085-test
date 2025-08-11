export interface ExportOptions {
  sessionId?: string;
  clientId?: string;
  caseId?: string;
  format: 'word' | 'pdf';
}

export const exportQuickConsult = async (options: ExportOptions): Promise<void> => {
  // Placeholder implementation for now
  console.log('Exporting quick consult session:', options);
  
  // In a real implementation, this would:
  // 1. Fetch the session data
  // 2. Generate the document (Word/PDF)
  // 3. Trigger download
  
  // For now, just simulate the export
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  throw new Error('Export functionality not yet implemented');
};

export const exportCaseAnalysis = async (options: ExportOptions): Promise<void> => {
  console.log('Exporting case analysis:', options);
  
  try {
    // Call the export-case-analysis edge function
    const response = await fetch('https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/export-case-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMDEyNjIsImV4cCI6MjA2MTc3NzI2Mn0._GXOu4i6i7iITULVAWiyZnY5G7AWcuuM2A9_t5C4bUI'}`
      },
      body: JSON.stringify({
        clientId: options.clientId,
        caseId: options.caseId,
        format: options.format,
        sections: []
      })
    });

    if (!response.ok) {
      const contentType = response.headers.get('Content-Type') || '';
      const impl = response.headers.get('X-Export-Impl');
      if (impl) console.warn('Export failed. Implementation:', impl);
      let errorText = '';
      try {
        if (contentType.includes('application/json')) {
          const json = await response.json();
          errorText = json?.error || JSON.stringify(json);
        } else {
          errorText = await response.text();
        }
      } catch {
        try { errorText = await response.text(); } catch { errorText = 'Unknown error'; }
      }
      throw new Error(`Export failed: ${response.status} ${errorText}`);
    }

    // Get the filename from the response headers
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `case_analysis.${options.format === 'pdf' ? 'pdf' : 'docx'}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    const implHeader = response.headers.get('X-Export-Impl');
    if (implHeader) {
      console.log('Export implementation:', implHeader);
    }

    // Convert response to blob and trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Export completed successfully');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};
