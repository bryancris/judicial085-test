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

// Process PDF document using server-side edge function with OCR fallback
export const processPdfDocument = async (
  file: File, 
  title: string, 
  clientId: string,
  caseId?: string
): Promise<{success: boolean, documentId?: string, error?: string}> => {
  let documentId: string | null = null;
  
  try {
    console.log(`Starting server-side PDF processing with OCR fallback for file: ${file.name}, client: ${clientId}, case: ${caseId || 'none'}`);
    
    // Generate a unique ID for the document
    documentId = crypto.randomUUID();
    
    // Step 1: Upload PDF to storage FIRST to get the URL
    const pdfUrl = await uploadPdfToStorage(file, clientId, caseId);
    console.log(`PDF uploaded to: ${pdfUrl}`);
    
    // Step 2: Create document metadata with 'processing' status AND the URL, explicitly setting include_in_analysis to false
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title,
        client_id: clientId,
        case_id: caseId || null,
        schema: caseId ? 'case_document' : 'client_document',
        processing_status: 'processing',
        url: pdfUrl,
        include_in_analysis: false // Explicitly set to false for new documents
      });
    
    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }
    
    console.log(`Document metadata created with ID: ${documentId}, status: processing, URL: ${pdfUrl}, include_in_analysis: false`);
    
    // Step 3: Call server-side processing edge function (now with OCR fallback)
    console.log('Calling server-side PDF processing function with OCR fallback...');
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
    
    // Check if OCR was used and provide appropriate feedback
    if (data.extractionResult?.isScanned) {
      console.log(`Document was processed using OCR for scanned content. Confidence: ${(data.extractionResult.confidence * 100).toFixed(1)}%`);
    }
    
    console.log(`Server-side PDF processing completed successfully for document: ${documentId}`);
    return { success: true, documentId };
    
  } catch (error: any) {
    console.error('Error processing PDF document:', error);
    
    // Mark as failed if we have a document ID, but preserve the URL and include_in_analysis setting
    if (documentId) {
      try {
        // Get existing document to preserve URL and include_in_analysis
        const { data: existingDoc } = await supabase
          .from('document_metadata')
          .select('url, include_in_analysis')
          .eq('id', documentId)
          .single();
        
        const updateData: any = {
          processing_status: 'failed',
          processing_error: error.message,
          processed_at: new Date().toISOString()
        };
        
        // Preserve URL and include_in_analysis even when marking as failed
        if (existingDoc?.url) {
          updateData.url = existingDoc.url;
          console.log(`Preserving URL during error: ${existingDoc.url}`);
        }
        if (existingDoc?.include_in_analysis !== undefined) {
          updateData.include_in_analysis = existingDoc.include_in_analysis;
          console.log(`Preserving include_in_analysis during error: ${existingDoc.include_in_analysis}`);
        }
        
        await supabase
          .from('document_metadata')
          .update(updateData)
          .eq('id', documentId);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }
    
    return { success: false, error: error.message };
  }
};

// Add utility function to reconstruct storage URL from document metadata
export const reconstructStorageUrl = (clientId: string, fileName?: string, documentId?: string): string | null => {
  if (!clientId) return null;
  
  // If we have a filename, try to reconstruct based on that
  if (fileName) {
    // For files that follow our naming pattern: timestamp_randomstring.ext
    const basePath = `${clientId}/${fileName}`;
    const { data } = supabase.storage
      .from('client_documents')
      .getPublicUrl(basePath);
    return data.publicUrl;
  }
  
  // If we have a document ID but no filename, we can't reliably reconstruct
  // This would require listing all files in the client folder and matching
  console.warn(`Cannot reconstruct storage URL for document ${documentId} without filename`);
  return null;
};

// Legacy client-side functions removed - now using server-side processing
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
