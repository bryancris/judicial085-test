
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDocumentDeletion = (
  clientId: string | undefined,
  onRefreshDocuments: () => Promise<void>
) => {
  const { toast } = useToast();

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!clientId) {
      console.error("Cannot delete document: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    if (!documentId) {
      console.error("Cannot delete document: No document ID provided");
      return { success: false, error: "No document ID provided" };
    }
    
    console.log(`Starting deletion for document ${documentId} for client ${clientId}`);
    
    try {
      // Convert string ID to number for database deletion
      const numericId = parseInt(documentId, 10);
      if (isNaN(numericId)) {
        throw new Error("Invalid document ID format");
      }
      
      // Delete from documents table
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', numericId);
      
      if (error) {
        throw new Error(`Error deleting document: ${error.message}`);
      }
      
      toast({
        title: "Document deleted",
        description: "Document has been permanently removed.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error("Error in document deletion:", error);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, toast]);

  return {
    deleteDocument
  };
};
