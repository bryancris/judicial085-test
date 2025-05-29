
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Generate embeddings and store chunks with enhanced validation
export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} validated chunks`);
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Validate chunk content before generating embedding
      if (!chunk || chunk.trim().length < 20) {
        console.warn(`Skipping chunk ${i}: too short or empty`);
        continue;
      }
      
      // Check for readable content
      const alphaChars = (chunk.match(/[a-zA-Z]/g) || []).length;
      const alphaRatio = alphaChars / chunk.length;
      
      if (alphaRatio < 0.3) {
        console.warn(`Skipping chunk ${i}: low alpha ratio (${alphaRatio})`);
        continue;
      }
      
      // Generate embedding for this validated chunk
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
            total_chunks: textChunks.length,
            alpha_ratio: alphaRatio,
            word_count: chunk.split(/\s+/).length,
            validated: true
          }
        });
      
      if (error) {
        throw new Error(`Failed to store chunk ${i}: ${error.message}`);
      }
      
      console.log(`Successfully stored validated chunk ${i + 1}/${textChunks.length}`);
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      throw error;
    }
  }
  
  console.log(`Successfully generated and stored embeddings for ${textChunks.length} validated chunks`);
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

// Clean up failed document processing
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
      console.log('Cleaned up existing chunks for failed document');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
