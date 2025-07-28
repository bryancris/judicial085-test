import { supabase } from '@/integrations/supabase/client';

// Upload firm document to storage
export const uploadFirmDocumentToStorage = async (file: File, userId: string, firmId?: string): Promise<string> => {
  try {
    console.log(`Uploading firm document to storage for user: ${userId}, firm: ${firmId || 'none'}`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = firmId ? `firm/${firmId}/${fileName}` : `user/${userId}/${fileName}`;
    
    // Upload file to client_documents bucket (reusing existing bucket for simplicity)
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
    
    console.log('Firm document uploaded successfully:', data.path);
    
    // Get public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    console.log('Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading firm document to storage:', error);
    throw new Error(`Failed to upload document to storage: ${error.message}`);
  }
};

// Process firm document using edge function
export const uploadAndProcessFirmDocument = async (
  file: File, 
  title: string, 
  userId: string,
  firmId?: string
): Promise<{success: boolean, documentId?: string, error?: string}> => {
  let documentId: string | null = null;
  
  try {
    console.log(`Starting firm document processing for file: ${file.name}, user: ${userId}, firm: ${firmId || 'none'}`);
    
    // Generate a unique ID for the document
    documentId = crypto.randomUUID();
    
    // Step 1: Upload document to storage FIRST to get the URL
    const documentUrl = await uploadFirmDocumentToStorage(file, userId, firmId);
    console.log(`Firm document uploaded to: ${documentUrl}`);
    
    // Step 2: Create document metadata with 'processing' status
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title,
        client_id: null, // No client for firm documents
        case_id: null,
        user_id: userId,
        firm_id: firmId || null,
        schema: 'firm_document',
        processing_status: 'processing',
        url: documentUrl,
        include_in_analysis: false
      });
    
    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }
    
    console.log(`Firm document metadata created with ID: ${documentId}, status: processing`);
    
    // Step 3: Call server-side processing edge function
    console.log('Calling server-side document processing function...');
    const { data, error: functionError } = await supabase.functions.invoke('process-pdf-document', {
      body: {
        documentId,
        clientId: null, // No client for firm documents
        caseId: null,
        userId,
        firmId,
        title,
        fileUrl: documentUrl,
        fileName: file.name
      }
    });
    
    if (functionError) {
      throw new Error(`Server-side processing failed: ${functionError.message}`);
    }
    
    if (!data || !data.success) {
      throw new Error(data?.error || 'Server-side processing failed');
    }
    
    console.log(`Server-side firm document processing completed successfully for document: ${documentId}`);
    return { success: true, documentId };
    
  } catch (error: any) {
    console.error('Error processing firm document:', error);
    
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