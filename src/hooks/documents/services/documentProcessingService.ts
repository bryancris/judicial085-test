
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { processPdfDocument } from "@/utils/pdfUtils";
import { chunkDocument } from "@/utils/documents/documentUtils";

export const useDocumentProcessingService = () => {
  const { toast } = useToast();

  const processFileDocument = async (
    file: File,
    title: string,
    clientId: string,
    scope: string
  ) => {
    console.log("Processing file:", file.name, "Type:", file.type);
    
    const caseId = scope !== "client-level" && scope !== "all" ? scope : undefined;
    const result = await processPdfDocument(file, title, clientId, caseId);
    
    if (result.success) {
      const fileType = file.type === 'application/pdf' ? 'PDF' : 'Word document';
      toast({
        title: `${fileType} processed successfully`,
        description: `Your ${fileType.toLowerCase()} has been uploaded and vectorized for search.`,
      });
      return result;
    } else {
      throw new Error(result.error || `Failed to process ${file.type === 'application/pdf' ? 'PDF' : 'Word document'}`);
    }
  };

  const processTextDocument = async (
    title: string,
    content: string,
    clientId: string,
    scope: string,
    metadata: any = {}
  ) => {
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
        include_in_analysis: false
      });
    
    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }
    
    // Create chunks
    const chunks = chunkDocument(content);
    
    // Store chunks
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
    
    return { success: true, documentId };
  };

  return {
    processFileDocument,
    processTextDocument
  };
};
