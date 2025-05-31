
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { processPdfDocument } from "@/utils/pdfUtils";

export const useDocumentProcessing = (
  clientId: string | undefined,
  scope: "client-level" | string = "client-level",
  onRefreshDocuments: () => Promise<void>
) => {
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
    
    try {
      // If it's a PDF file, use the PDF processing pipeline
      if (file && file.type === 'application/pdf') {
        console.log("Processing PDF file:", file.name);
        
        const caseId = scope !== "client-level" && scope !== "all" ? scope : undefined;
        const result = await processPdfDocument(file, title, clientId, caseId);
        
        if (result.success) {
          toast({
            title: "PDF processed successfully",
            description: "Your PDF has been uploaded and vectorized for search.",
          });
          
          // Refresh the document list
          await onRefreshDocuments();
          return result;
        } else {
          throw new Error(result.error || "Failed to process PDF");
        }
      }
      
      // Handle text documents - store in documents table
      const caseId = scope !== "client-level" && scope !== "all" ? scope : null;
      
      const documentMetadata = {
        client_id: clientId,
        case_id: caseId,
        title: title,
        file_type: 'text',
        created_at: new Date().toISOString(),
        ...metadata
      };
      
      // Insert into documents table
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content,
          metadata: documentMetadata
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error creating document: ${error.message}`);
      }
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been saved.",
      });
      
      // Refresh the document list
      await onRefreshDocuments();
      
      return { success: true, documentId: data.id };
      
    } catch (error: any) {
      console.error("Error processing document:", error);
      
      toast({
        title: "Document processing failed",
        description: error.message || "An error occurred while processing the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, scope, onRefreshDocuments, toast]);

  return {
    processDocument
  };
};
