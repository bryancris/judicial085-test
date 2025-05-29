import { supabase } from '@/integrations/supabase/client';

// Upload PDF file to Supabase Storage
export const uploadPdfToStorage = async (file: File, clientId: string, caseId?: string): Promise<string> => {
  try {
    console.log(`Uploading PDF to storage for client: ${clientId}, case: ${caseId || 'none'}`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;
    
    // Upload file to client_documents bucket
    const { data, error } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
    
    console.log('File uploaded successfully:', data.path);
    
    // Get public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    console.log('Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw new Error(`Failed to upload PDF file to storage: ${error.message}`);
  }
};

// Process PDF document using server-side edge function
export const processPdfDocument = async (
  file: File, 
  title: string, 
  clientId: string,
  caseId?: string
): Promise<{success: boolean, documentId?: string, error?: string}> => {
  let documentId: string | null = null;
  
  try {
    console.log(`Starting server-side PDF processing for file: ${file.name}, client: ${clientId}, case: ${caseId || 'none'}`);
    
    // Generate a unique ID for the document
    documentId = crypto.randomUUID();
    
    // Step 1: Create document metadata with 'processing' status
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title,
        client_id: clientId,
        case_id: caseId || null,
        schema: caseId ? 'case_document' : 'client_document',
        processing_status: 'processing'
      });
    
    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }
    
    console.log(`Document metadata created with ID: ${documentId}, status: processing`);
    
    // Step 2: Upload PDF to storage
    const pdfUrl = await uploadPdfToStorage(file, clientId, caseId);
    console.log(`PDF uploaded to: ${pdfUrl}`);
    
    // Step 3: Update document metadata with URL
    const { error: updateError } = await supabase
      .from('document_metadata')
      .update({ url: pdfUrl })
      .eq('id', documentId);
    
    if (updateError) {
      console.warn(`Warning: Could not update document URL: ${updateError.message}`);
    }
    
    // Step 4: Call server-side processing edge function
    console.log('Calling server-side PDF processing function...');
    const { data, error: functionError } = await supabase.functions.invoke('process-pdf-document', {
      body: {
        documentId,
        clientId,
        caseId: caseId || null,
        title,
        fileUrl: pdfUrl,
        fileName: file.name
      }
    });
    
    if (functionError) {
      throw new Error(`Server-side processing failed: ${functionError.message}`);
    }
    
    if (!data || !data.success) {
      throw new Error(data?.error || 'Server-side processing failed');
    }
    
    console.log(`Server-side PDF processing completed successfully for document: ${documentId}`);
    return { success: true, documentId };
    
  } catch (error: any) {
    console.error('Error processing PDF document:', error);
    
    // Mark as failed if we have a document ID
    if (documentId) {
      try {
        await supabase
          .from('document_metadata')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', documentId);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }
    
    return { success: false, error: error.message };
  }
};

// Legacy client-side functions removed - now using server-side processing
// The following functions are no longer needed:
// - extractTextFromPdf
// - generateEmbeddings  
// - chunkDocument (moved to server-side)

// Keep these utility functions for backward compatibility if needed elsewhere
export const generateEmbeddings = async (
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {}
): Promise<void> => {
  console.warn('generateEmbeddings: This function is deprecated. PDF processing now happens server-side.');
  throw new Error('This function has been replaced by server-side processing. Use processPdfDocument instead.');
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  console.warn('extractTextFromPdf: This function is deprecated. PDF processing now happens server-side.');
  throw new Error('This function has been replaced by server-side processing. Use processPdfDocument instead.');
};
