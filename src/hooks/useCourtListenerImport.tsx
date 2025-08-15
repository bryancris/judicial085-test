import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ImportResult {
  success: boolean;
  imported_count: number;
  errors: string[];
  message: string;
}

export const useCourtListenerImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const importCases = async (searchQueries?: string[]): Promise<ImportResult | null> => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-courtlistener-cases', {
        body: { searchQueries: searchQueries || [] }
      });

      if (error) {
        console.error('Import function error:', error);
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import cases from CourtListener",
          variant: "destructive",
        });
        return null;
      }

      const result = data as ImportResult;
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.imported_count} new cases from CourtListener`,
        });
      } else {
        toast({
          title: "Import Issues",
          description: `Import completed with errors. Check console for details.`,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Import hook error:', error);
      toast({
        title: "Import Error",
        description: "An unexpected error occurred during import",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importCases,
    isImporting
  };
};