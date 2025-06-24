
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { processPdfDocument } from "@/utils/pdfUtils";
import { chunkDocument } from "@/utils/documents/documentUtils";
import { validateDocumentTitle } from "@/utils/documentCleanupService";

export const useDocumentProcessor = (
  clientId: string | undefined,
  scope: "client-level" | string = "client-level",
  onRefresh: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processDocument = useCallback(async (
    title: string, 
    content: string, 
    metadata: any = {},
    file?: File
  ) => {
    if (!clientId) {
      console.error("Cannot process document: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    // Validate document title to prevent test documents
    const validation = validateDocumentTitle(title);
    if (!validation.valid) {
      toast({
        title: "Document creation blocked",
        description: validation.error,
        variant: "destructive",
      });
      return { success: false, error: validation.error };
    }
    
    setIsProcessing(true);
    
    try {
      // If it's a PDF or Word file, use the PDF processing pipeline (which supports both)
      if (file && (file.type === 'application/pdf' || 
                   file.type.includes('wordprocessingml') || 
                   file.name.toLowerCase().endsWith('.docx'))) {
        console.log("Processing file:", file.name, "Type:", file.type);
        
        const caseId = scope !== "client-level" && scope !== "all" ? scope : undefined;
        const result = await processPdfDocument(file, title, clientId, caseId);
        
        if (result.success) {
          const fileType = file.type === 'application/pdf' ? 'PDF' : 'Word document';
          toast({
            title: `${fileType} processed successfully`,
            description: `Your ${fileType.toLowerCase()} has been uploaded and vectorized for search.`,
          });
          
          // Refresh the document list
          onRefresh();
          return result;
        } else {
          throw new Error(result.error || `Failed to process ${file.type === 'application/pdf' ? 'PDF' : 'Word document'}`);
        }
      }
      
      // Handle text documents
      const documentId = crypto.randomUUID();
      const caseId = scope !== "client-level" && scope !== "all" ? scope : null;
      
      // Insert document metadata
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title,
          client_id: clientId,
          case_id: caseId,
          schema: caseId ? 'case_document' : 'client_document',
          url: metadata.url || null,
          include_in_analysis: false // Default to false for new documents
        });
      
      if (metadataError) {
        throw new Error(`Error creating document metadata: ${metadataError.message}`);
      }
      
      // For text documents, create simple chunks
      const chunks = chunkDocument(content);
      
      // Store chunks directly (without embeddings for now - you may want to add this)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            client_id: clientId,
            case_id: caseId,
            chunk_index: i,
            content: chunk,
            metadata: { ...metadata, chunkIndex: i, totalChunks: chunks.length }
          });
        
        if (chunkError) {
          throw new Error(`Error storing chunk ${i}: ${chunkError.message}`);
        }
      }
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been saved.",
      });
      
      // Refresh the document list
      onRefresh();
      
      return { success: true, documentId };
      
    } catch (error: any) {
      console.error("Error processing document:", error);
      
      toast({
        title: "Document processing failed",
        description: error.message || "An error occurred while processing the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, scope, onRefresh, toast]);

  const updateDocument = useCallback(async (
    documentId: string,
    title: string,
    content: string,
    metadata: any = {}
  ) => {
    if (!clientId || !documentId) {
      console.error("Cannot update document: No client ID or document ID provided");
      return { success: false, error: "No client ID or document ID provided" };
    }

    setIsProcessing(true);

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
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, toast]);

  return {
    isProcessing,
    processDocument,
    updateDocument
  };
};
