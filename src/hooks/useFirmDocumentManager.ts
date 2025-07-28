import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFirmDocumentManager = (
  documents: any[],
  setDocuments: (fn: (prev: any[]) => any[]) => void
) => {
  const { toast } = useToast();

  const toggleDocumentAnalysis = useCallback(async (documentId: string, includeInAnalysis: boolean) => {
    console.log(`[DEBUG] Toggling firm document ${documentId} analysis to: ${includeInAnalysis}`);
    
    try {
      // First, let's check if the document exists
      const { data: existingDoc, error: checkError } = await supabase
        .from('document_metadata')
        .select('id, include_in_analysis, firm_id')
        .eq('id', documentId)
        .is('client_id', null) // Firm documents have null client_id
        .not('firm_id', 'is', null) // But have a firm_id
        .single();
      
      if (checkError) {
        console.error(`[ERROR] Error checking document existence:`, checkError);
        throw new Error(`Error checking document: ${checkError.message}`);
      }
      
      if (!existingDoc) {
        console.error(`[ERROR] Firm document not found with ID: ${documentId}`);
        throw new Error(`Document not found: ${documentId}`);
      }
      
      console.log(`[DEBUG] Found existing firm document:`, existingDoc);
      
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
      
      console.log(`[DEBUG] Successfully updated firm document ${documentId} include_in_analysis to: ${includeInAnalysis}`);
      
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
  }, [documents, setDocuments, toast]);

  const deleteDocument = useCallback(async (documentId: string) => {
    if (!documentId) {
      console.error("Cannot delete document: No document ID provided");
      return { success: false, error: "No document ID provided" };
    }
    
    console.log(`Starting deletion for firm document ${documentId}`);
    
    try {
      // Update UI state optimistically
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Delete document chunks first
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);
      
      if (chunksError) {
        console.error("Error deleting document chunks:", chunksError);
        throw new Error(`Error deleting document chunks: ${chunksError.message}`);
      }
      
      // Delete document metadata
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .delete()
        .eq('id', documentId);
      
      if (metadataError) {
        console.error("Error deleting document metadata:", metadataError);
        throw new Error(`Error deleting document metadata: ${metadataError.message}`);
      }
      
      console.log(`Firm document deletion successful for ${documentId}`);
      
      toast({
        title: "Document deleted",
        description: "Document has been permanently removed from the library.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error("Error in firm document deletion:", error);
      
      // Restore document in UI on error
      setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [documents, setDocuments, toast]);

  return {
    toggleDocumentAnalysis,
    deleteDocument
  };
};