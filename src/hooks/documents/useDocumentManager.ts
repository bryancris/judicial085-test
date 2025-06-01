
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { deleteClientDocument } from "@/utils/api/baseApiService";

export const useDocumentManager = (
  clientId: string | undefined,
  documents: any[],
  setDocuments: (fn: (prev: any[]) => any[]) => void
) => {
  const { toast } = useToast();

  const toggleDocumentAnalysis = useCallback(async (documentId: string, includeInAnalysis: boolean) => {
    if (!clientId) {
      console.error("Cannot toggle document analysis: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    console.log(`[DEBUG] Toggling document ${documentId} analysis to: ${includeInAnalysis}`);
    console.log(`[DEBUG] Current documents state before toggle:`, documents.find(d => d.id === documentId)?.include_in_analysis);
    
    try {
      // First, let's check if the document exists
      const { data: existingDoc, error: checkError } = await supabase
        .from('document_metadata')
        .select('id, include_in_analysis, client_id')
        .eq('id', documentId)
        .single();
      
      if (checkError) {
        console.error(`[ERROR] Error checking document existence:`, checkError);
        throw new Error(`Error checking document: ${checkError.message}`);
      }
      
      if (!existingDoc) {
        console.error(`[ERROR] Document not found with ID: ${documentId}`);
        throw new Error(`Document not found: ${documentId}`);
      }
      
      console.log(`[DEBUG] Found existing document:`, existingDoc);
      
      // Update database
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
        console.error(`[ERROR] No rows updated for document ID: ${documentId}`);
        throw new Error(`Failed to update document: ${documentId}`);
      }
      
      console.log(`[DEBUG] Database update successful:`, data);
      
      // Update local state to match database
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, include_in_analysis: includeInAnalysis }
            : doc
        )
      );
      
      console.log(`[DEBUG] Successfully updated document ${documentId} include_in_analysis to: ${includeInAnalysis}`);
      
      toast({
        title: includeInAnalysis ? "Document included in analysis" : "Document excluded from analysis",
        description: includeInAnalysis 
          ? "This document will now be considered during AI analysis."
          : "This document will be excluded from AI analysis.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error(`[ERROR] Error toggling document analysis:`, error);
      
      toast({
        title: "Error updating document",
        description: error.message || "An error occurred while updating the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, documents, setDocuments, toast]);

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
      // Update UI state optimistically
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Call the edge function to delete the document
      const result = await deleteClientDocument(documentId, clientId);
      
      console.log(`Document deletion result:`, result);
      
      if (result.success) {
        toast({
          title: "Document deleted",
          description: "Document has been permanently removed.",
        });
        
        return { success: true };
      } else {
        // Restore the document in the UI
        setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
        
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
      console.error("Error in document deletion:", error);
      
      // Restore document in UI on error
      setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, documents, setDocuments, toast]);

  return {
    toggleDocumentAnalysis,
    deleteDocument
  };
};
