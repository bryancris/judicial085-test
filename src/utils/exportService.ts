
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ExportOptions {
  clientId: string;
  caseId?: string;
  format: 'pdf' | 'word';
  sections?: string[];
}

export const exportCaseAnalysis = async (options: ExportOptions): Promise<void> => {
  try {
    console.log('Starting export with options:', options);

    const { data, error } = await supabase.functions.invoke('export-case-analysis', {
      body: options,
    });

    if (error) {
      throw new Error(error.message || 'Export failed');
    }

    // The response should be a blob/file
    if (data instanceof Blob) {
      downloadFile(data, generateFilename(options));
    } else {
      throw new Error('Invalid response format from export service');
    }

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
