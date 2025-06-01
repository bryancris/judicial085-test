
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { deleteClientDocument } from "@/utils/api/baseApiService";

export const useCaseDocumentManager = (
  clientId: string | undefined,
  caseId: string | undefined,
  documents: any[],
  setDocuments: (fn: (prev: any[]) => any[]) => void
) => {
  const { toast } = useToast();

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!clientId || !caseId) {
      console.error("Cannot delete document: No client ID or case ID provided");
      return { success: false, error: "No client ID or case ID provided" };
    }
    
    if (!documentId) {
      console.error("Cannot delete document: No document ID provided");
      return { success: false, error: "No document ID provided" };
    }
    
    console.log(`Starting deletion for case document ${documentId} for client ${clientId}, case ${caseId}`);
    
    try {
      // 1. Update UI state optimistically (can be rolled back if deletion fails)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // 2. Call the edge function to delete the document with admin privileges
      const result = await deleteClientDocument(documentId, clientId);
      
      console.log(`Case document deletion result:`, result);
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Document deleted",
          description: "Case document has been permanently removed.",
        });
        
        return { success: true };
      } else {
        // If failed, restore the document in the UI
        setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
        
        // Show error toast with the error from the edge function
        toast({
          title: "Error deleting document",
          description: result.error || "An error occurred while deleting the document.",
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: result.error || "Failed to delete document" 
        };
      }
    } catch (error: any) {
      console.error("Error in case document deletion:", error);
      
      // Restore document in UI on error
      setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, caseId, documents, setDocuments, toast]);
  
  const toggleDocumentAnalysis = useCallback(async (documentId: string, includeInAnalysis: boolean) => {
    if (!clientId || !caseId) {
      console.error("Cannot toggle document analysis: No client ID or case ID provided");
      return { success: false, error: "No client ID or case ID provided" };
    }
    
    console.log(`[DEBUG] Toggling case document ${documentId} analysis to: ${includeInAnalysis}`);
    console.log(`[DEBUG] Current documents state before toggle:`, documents.find(d => d.id === documentId)?.include_in_analysis);
    
    try {
      // Update database using only document ID (simplified query)
      const { data, error } = await supabase
        .from('document_metadata')
        .update({ include_in_analysis: includeInAnalysis })
        .eq('id', documentId)
        .select('include_in_analysis');
      
      if (error) {
        console.error(`[ERROR] Database update failed:`, error);
        throw new Error(`Error updating document: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.error(`[ERROR] No document found with ID: ${documentId}`);
        throw new Error(`Document not found: ${documentId}`);
      }
      
      console.log(`[DEBUG] Database update successful:`, data);
      
      // Verify the update by fetching the document again
      const { data: verifyData, error: verifyError } = await supabase
        .from('document_metadata')
        .select('include_in_analysis')
        .eq('id', documentId)
        .single();
      
      if (verifyError) {
        console.error(`[ERROR] Verification query failed:`, verifyError);
      } else {
        console.log(`[DEBUG] Verification query result:`, verifyData);
      }
      
      // Now update local state to match database
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, include_in_analysis: includeInAnalysis }
            : doc
        )
      );
      
      console.log(`[DEBUG] Successfully updated case document ${documentId} include_in_analysis to: ${includeInAnalysis}`);
      
      toast({
        title: includeInAnalysis ? "Document included in analysis" : "Document excluded from analysis",
        description: includeInAnalysis 
          ? "This document will now be considered during AI analysis."
          : "This document will be excluded from AI analysis.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error(`[ERROR] Error toggling case document analysis:`, error);
      
      toast({
        title: "Error updating document",
        description: error.message || "An error occurred while updating the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, caseId, documents, setDocuments, toast]);

  return {
    deleteDocument,
    toggleDocumentAnalysis
  };
};
