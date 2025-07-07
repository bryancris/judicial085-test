
// Document status service with OCR processing status support

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

export async function updateDocumentStatus(
  supabase: any,
  documentId: string,
  status: 'processing' | 'completed' | 'failed',
  fileUrl?: string,
  processingNotes?: string
): Promise<void> {
  try {
    console.log(`📊 Updating document ${documentId} status to: ${status}`);
    
    const updateData: any = {
      processing_status: status,
      processed_at: new Date().toISOString()
    };
    
    // Preserve URL if provided
    if (fileUrl) {
      updateData.url = fileUrl;
      console.log(`🔗 Preserving document URL: ${fileUrl}`);
    }
    
    // Add processing notes (useful for OCR status)
    if (processingNotes) {
      updateData.processing_notes = processingNotes;
      console.log(`📝 Adding processing notes: ${processingNotes}`);
    }
    
    // Clear any previous errors on successful completion
    if (status === 'completed') {
      updateData.processing_error = null;
    }
    
    const { error } = await supabase
      .from('document_metadata')
      .update(updateData)
      .eq('id', documentId);
    
    if (error) {
      throw new Error(`Failed to update document status: ${error.message}`);
    }
    
    console.log(`✅ Document ${documentId} status updated to ${status}`);
    
  } catch (error) {
    console.error(`❌ Error updating document status for ${documentId}:`, error);
    throw error;
  }
}

export async function updateDocumentProcessingNotes(
  supabase: any,
  documentId: string,
  notes: string
): Promise<void> {
  try {
    console.log(`📝 Adding processing notes to document ${documentId}: ${notes}`);
    
    const { error } = await supabase
      .from('document_metadata')
      .update({ 
        processing_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (error) {
      throw new Error(`Failed to update processing notes: ${error.message}`);
    }
    
    console.log(`✅ Processing notes updated for document ${documentId}`);
    
  } catch (error) {
    console.error(`❌ Error updating processing notes for ${documentId}:`, error);
    throw error;
  }
}

export async function cleanupFailedDocument(
  supabase: any,
  documentId: string
): Promise<void> {
  try {
    console.log(`🧹 Cleaning up failed document processing for ${documentId}`);
    
    // Remove any partial document chunks that may have been created
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);
    
    if (chunksError) {
      console.warn(`Warning: Could not clean up chunks for ${documentId}:`, chunksError);
    } else {
      console.log(`✅ Cleaned up partial chunks for document ${documentId}`);
    }
    
  } catch (error) {
    console.error(`❌ Error during cleanup for ${documentId}:`, error);
    // Don't throw - cleanup is best effort
  }
}
