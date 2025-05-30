
import { updateDocumentStatus, cleanupFailedDocument } from '../databaseService.ts';

export async function handleProcessingError(
  error: any,
  documentId: string | null,
  supabase: any
): Promise<void> {
  if (documentId) {
    try {
      await cleanupFailedDocument(documentId, supabase);
      await updateDocumentStatus(documentId, 'failed', supabase, error.message);
    } catch (updateError) {
      console.error('Failed to update document status:', updateError);
    }
  }
}
