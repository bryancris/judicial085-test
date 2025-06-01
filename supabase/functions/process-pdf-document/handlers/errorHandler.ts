
import { updateDocumentStatus, cleanupFailedDocument } from '../databaseService.ts';

export async function handleProcessingError(
  error: any,
  documentId: string | null,
  supabase: any
): Promise<void> {
  if (documentId) {
    try {
      // Get existing document to preserve URL even during error handling
      const { data: existingDoc } = await supabase
        .from('document_metadata')
        .select('url')
        .eq('id', documentId)
        .single();
      
      // Clean up failed chunks, but preserve the document metadata
      await cleanupFailedDocument(documentId, supabase);
      
      // Update to failed status while preserving URL
      const errorUpdateData: any = {
        processing_status: 'failed',
        processing_error: error.message,
        processed_at: new Date().toISOString()
      };
      
      // Always preserve URL even when marking as failed
      if (existingDoc?.url) {
        errorUpdateData.url = existingDoc.url;
        console.log(`Preserving URL during error handling: ${existingDoc.url}`);
      } else {
        console.warn(`No URL found to preserve for document ${documentId} during error handling`);
      }
      
      const { error: updateError } = await supabase
        .from('document_metadata')
        .update(errorUpdateData)
        .eq('id', documentId);
      
      if (updateError) {
        console.error('Failed to update document status during error handling:', updateError);
      } else {
        console.log(`Document ${documentId} marked as failed (URL preserved: ${!!existingDoc?.url})`);
      }
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }
  }
}
