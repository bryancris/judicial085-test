
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { chunkDocument } from "@/utils/documents/documentUtils";

export const useDocumentUpdateService = () => {
  const { toast } = useToast();

  const updateDocument = async (
    documentId: string,
    title: string,
    content: string,
    clientId: string,
    metadata: any = {}
  ) => {
    if (!clientId || !documentId) {
      console.error("Cannot update document: No client ID or document ID provided");
      return { success: false, error: "No client ID or document ID provided" };
    }

    try {
      // Update document metadata title and timestamp
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .update({
          title,
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('client_id', clientId);

      if (metadataError) {
        throw new Error(`Error updating document metadata: ${metadataError.message}`);
      }

      // Delete existing chunks for this document
      const { error: deleteError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId)
        .eq('client_id', clientId);

      if (deleteError) {
        throw new Error(`Error deleting existing chunks: ${deleteError.message}`);
      }

      // Create new chunks with updated content
      const chunks = chunkDocument(content);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            client_id: clientId,
            case_id: metadata.caseId || null,
            chunk_index: i,
            content: chunk,
            metadata: { ...metadata, chunkIndex: i, totalChunks: chunks.length }
          });
        
        if (chunkError) {
          throw new Error(`Error storing updated chunk ${i}: ${chunkError.message}`);
        }
      }

      return { success: true, documentId };

    } catch (error: any) {
      console.error("Error updating document:", error);
      
      toast({
        title: "Document update failed",
        description: error.message || "An error occurred while updating the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  };

  return { updateDocument };
};
