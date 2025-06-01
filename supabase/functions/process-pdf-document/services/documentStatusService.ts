
// Enhanced document status updates with comprehensive logging
export async function updateDocumentStatus(
  documentId: string, 
  status: 'processing' | 'completed' | 'failed',
  supabase: any,
  error?: string
): Promise<void> {
  try {
    // First, get the current document to preserve existing fields like URL
    const { data: existingDoc } = await supabase
      .from('document_metadata')
      .select('url')
      .eq('id', documentId)
      .single();
    
    const updateData: any = {
      processing_status: status,
      processed_at: new Date().toISOString()
    };
    
    // Preserve the existing URL if it exists
    if (existingDoc?.url) {
      updateData.url = existingDoc.url;
    }
    
    if (error) {
      updateData.processing_error = error;
      updateData.processing_notes = `Advanced processing failed: ${error}`;
    } else if (status === 'completed') {
      updateData.processing_notes = 'Successfully processed with advanced library and OCR extraction strategy';
    }
    
    const { error: updateError } = await supabase
      .from('document_metadata')
      .update(updateData)
      .eq('id', documentId);
    
    if (updateError) {
      console.error(`Failed to update document status to ${status}:`, updateError);
      throw updateError;
    } else {
      console.log(`Document ${documentId} status updated to: ${status}${existingDoc?.url ? ' (URL preserved)' : ''}`);
    }
  } catch (error: any) {
    console.error(`Error updating document status:`, error);
    throw error;
  }
}

// Enhanced cleanup with comprehensive error handling
export async function cleanupFailedDocument(
  documentId: string,
  supabase: any
): Promise<void> {
  try {
    console.log(`Cleaning up failed document: ${documentId}`);
    
    // Delete any existing chunks for this document
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    if (deleteError) {
      console.error('Error deleting existing chunks:', deleteError);
    } else {
      console.log('Successfully cleaned up existing chunks for failed document');
    }
    
    // Update metadata to reflect cleanup
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .update({
        processing_notes: 'Document processing failed and chunks were cleaned up',
        processing_error: 'Advanced extraction failed - document requires manual processing'
      })
      .eq('id', documentId);
    
    if (metadataError) {
      console.error('Error updating metadata during cleanup:', metadataError);
    }
    
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error);
    // Don't throw - cleanup failure shouldn't prevent error reporting
  }
}
