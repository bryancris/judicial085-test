
import { updateDocumentStatus } from '../services/documentStatusService.ts';

export async function handleProcessingError(
  error: any,
  documentId: string | null,
  supabase: any
) {
  console.error('❌ Document processing error:', error);
  
  if (documentId) {
    try {
      // Get existing document to preserve URL and include_in_analysis
      const { data: existingDoc } = await supabase
        .from('document_metadata')
        .select('url, include_in_analysis')
        .eq('id', documentId)
        .single();
      
      // Update document status to failed but preserve URL and settings
      const updateData: any = {
        processing_status: 'failed',
        processing_error: error.message || 'Unknown processing error',
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
      
      const { error: updateError } = await supabase
        .from('document_metadata')
        .update(updateData)
        .eq('id', documentId);
      
      if (updateError) {
        console.error('Error updating failed document status:', updateError);
      } else {
        console.log(`✅ Document ${documentId} marked as failed with preserved settings`);
      }
      
    } catch (cleanupError) {
      console.error('Error during failure cleanup:', cleanupError);
    }
  }
}
