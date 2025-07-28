import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { uploadAndProcessFirmDocument } from "@/utils/firmDocumentUtils";
import { chunkDocument } from "@/utils/documents/documentUtils";
import { useAuthState } from "@/hooks/useAuthState";

export const useFirmDocumentProcessingService = () => {
  const { toast } = useToast();
  const { session } = useAuthState();

  const processFileDocument = async (
    file: File,
    title: string
  ) => {
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    console.log("Processing firm file:", file.name, "Type:", file.type);
    
    // Get user's firm ID
    const { data: firmData } = await supabase
      .from('firm_users')
      .select('firm_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    // Upload to firm-level storage and process
    const result = await uploadAndProcessFirmDocument(file, title, session.user.id, firmData?.firm_id);
    
    if (result.success) {
      const fileType = file.type === 'application/pdf' ? 'PDF' : 'Word document';
      toast({
        title: `${fileType} processed successfully`,
        description: `Your ${fileType.toLowerCase()} has been uploaded and is available in Quick Consult.`,
      });
      return result;
    } else {
      throw new Error(result.error || `Failed to process ${file.type === 'application/pdf' ? 'PDF' : 'Word document'}`);
    }
  };

  const processTextDocument = async (
    title: string,
    content: string,
    metadata: any = {}
  ) => {
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const documentId = crypto.randomUUID();
    
    // Get user's firm ID
    const { data: firmData } = await supabase
      .from('firm_users')
      .select('firm_id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();
    
    // Insert document metadata for firm-level document
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title,
        client_id: null, // No client for firm documents
        case_id: null,
        user_id: session.user.id,
        firm_id: firmData?.firm_id || null,
        schema: 'firm_document',
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
          client_id: null, // No client for firm documents
          case_id: null,
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
      description: "Your document has been saved and is available in Quick Consult.",
    });
    
    return { success: true, documentId };
  };

  return {
    processFileDocument,
    processTextDocument
  };
};