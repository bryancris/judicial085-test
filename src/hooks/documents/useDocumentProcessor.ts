
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useDocumentValidation } from "./services/documentValidationService";
import { useDocumentProcessingService } from "./services/documentProcessingService";
import { useDocumentUpdateService } from "./services/documentUpdateService";

export const useDocumentProcessor = (
  clientId: string | undefined,
  scope: "client-level" | string = "client-level",
  onRefresh: () => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { validateTitle } = useDocumentValidation();
  const { processFileDocument, processTextDocument } = useDocumentProcessingService();
  const { updateDocument } = useDocumentUpdateService();

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
    
    // Validate document title
    const validation = validateTitle(title);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    setIsProcessing(true);
    
    try {
      // Handle file documents (PDF/Word)
      if (file && (file.type === 'application/pdf' || 
                   file.type.includes('wordprocessingml') || 
                   file.name.toLowerCase().endsWith('.docx'))) {
        const result = await processFileDocument(file, title, clientId, scope);
        onRefresh();
        return result;
      }
      
      // Handle text documents
      const result = await processTextDocument(title, content, clientId, scope, metadata);
      onRefresh();
      return result;
      
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
  }, [clientId, scope, onRefresh, toast, validateTitle, processFileDocument, processTextDocument]);

  const updateDocumentWrapper = useCallback(async (
    documentId: string,
    title: string,
    content: string,
    metadata: any = {}
  ) => {
    if (!clientId) {
      return { success: false, error: "No client ID provided" };
    }

    setIsProcessing(true);
    
    try {
      const result = await updateDocument(documentId, title, content, clientId, metadata);
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, updateDocument]);

  return {
    isProcessing,
    processDocument,
    updateDocument: updateDocumentWrapper
  };
};
