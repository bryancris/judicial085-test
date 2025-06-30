
import { updateDocumentStatus, cleanupFailedDocument } from '../services/documentStatusService.ts';

export async function handleProcessingError(
  error: any,
  documentId: string | null,
  supabase: any
) {
  console.error('❌ Document processing error:', error);
  
  if (documentId) {
    try {
      // Update document status to failed
      await updateDocumentStatus(
        supabase,
        documentId,
        'failed',
        undefined,
        error.message || 'Unknown processing error'
      );
      
      // Clean up any partial data
      await cleanupFailedDocument(supabase, documentId);
    } catch (cleanupError) {
      console.error('Error during failure cleanup:', cleanupError);
    }
  }
}
