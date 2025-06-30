
export async function updateDocumentStatus(
  supabase: any,
  documentId: string,
  status: 'processing' | 'completed' | 'failed',
  fileUrl?: string,
  processingError?: string
) {
  console.log(`Updating document ${documentId} status to: ${status}`);
  
  const updateData: any = {
    processing_status: status,
    processed_at: new Date().toISOString()
  };

  // Preserve URL if provided
  if (fileUrl) {
    updateData.url = fileUrl;
    console.log(`Preserving URL: ${fileUrl}`);
  }

  // Add error message if status is failed
  if (status === 'failed' && processingError) {
    updateData.processing_error = processingError;
    updateData.processing_notes = 'Processing failed with error';
  } else if (status === 'completed') {
    updateData.processing_notes = 'Successfully processed with advanced extraction';
    updateData.processing_error = null; // Clear any previous errors
  } else if (status === 'processing') {
    updateData.processing_notes = 'Document processing in progress';
    updateData.processing_error = null; // Clear any previous errors
  }

  const { error } = await supabase
    .from('document_metadata')
    .update(updateData)
    .eq('id', documentId);

  if (error) {
    console.error(`Failed to update document status to ${status}:`, error);
    throw error;
  }

  console.log(`Document ${documentId} status updated to: ${status}`);
}

export async function cleanupFailedDocument(
  supabase: any,
  documentId: string
) {
  console.log(`Cleaning up failed document: ${documentId}`);
  
  try {
    // Delete any document chunks that might have been created
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    if (chunksError) {
      console.error('Error cleaning up document chunks:', chunksError);
    }
    
    console.log(`Cleanup completed for document: ${documentId}`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
