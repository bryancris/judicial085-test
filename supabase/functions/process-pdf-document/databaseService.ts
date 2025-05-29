
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Generate embeddings and store chunks
export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} chunks`);
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk, openaiApiKey);
      
      // Store the chunk with its embedding
      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          client_id: clientId,
          case_id: metadata.caseId,
          chunk_index: i,
          content: chunk,
          embedding: embedding,
          metadata: {
            ...metadata,
            chunk_length: chunk.length,
            total_chunks: textChunks.length
          }
        });
      
      if (error) {
        throw new Error(`Failed to store chunk ${i}: ${error.message}`);
      }
      
      console.log(`Stored chunk ${i + 1}/${textChunks.length}`);
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      throw error;
    }
  }
}

// Update document processing status
export async function updateDocumentStatus(
  documentId: string, 
  status: 'processing' | 'completed' | 'failed',
  supabase: any,
  error?: string
): Promise<void> {
  const updateData: any = {
    processing_status: status,
    processed_at: new Date().toISOString()
  };
  
  if (error) {
    updateData.processing_error = error;
  }
  
  const { error: updateError } = await supabase
    .from('document_metadata')
    .update(updateData)
    .eq('id', documentId);
  
  if (updateError) {
    console.error(`Failed to update document status to ${status}:`, updateError);
  } else {
    console.log(`Document ${documentId} status updated to: ${status}`);
  }
}
