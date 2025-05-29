
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Generate embeddings and store chunks with comprehensive error handling
export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} text chunks`);
  
  let successfulChunks = 0;
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Basic validation
      if (!chunk || chunk.trim().length < 10) {
        console.warn(`Skipping chunk ${i}: too short`);
        continue;
      }
      
      // Generate embedding for this chunk
      let embedding: number[] = [];
      
      try {
        embedding = await generateEmbedding(chunk, openaiApiKey);
      } catch (embeddingError) {
        console.warn(`Failed to generate embedding for chunk ${i}:`, embeddingError);
        // Continue without embedding for this chunk
        embedding = [];
      }
      
      // Store the chunk with or without embedding
      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          client_id: clientId,
          case_id: metadata.caseId,
          chunk_index: i,
          content: chunk,
          embedding: embedding.length > 0 ? embedding : null,
          metadata: {
            ...metadata,
            chunk_length: chunk.length,
            total_chunks: textChunks.length,
            word_count: chunk.split(/\s+/).length,
            content_type: 'document',
            has_embedding: embedding.length > 0,
            processing_timestamp: new Date().toISOString()
          }
        });
      
      if (error) {
        console.error(`Failed to store chunk ${i}:`, error);
        // Continue with next chunk instead of failing completely
        continue;
      }
      
      successfulChunks++;
      console.log(`Successfully stored chunk ${i + 1}/${textChunks.length}`);
      
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      // Continue with next chunk
      continue;
    }
  }
  
  if (successfulChunks === 0) {
    throw new Error('No chunks could be stored successfully');
  }
  
  console.log(`Successfully stored ${successfulChunks}/${textChunks.length} chunks`);
}

// Update document processing status with better error handling
export async function updateDocumentStatus(
  documentId: string, 
  status: 'processing' | 'completed' | 'failed',
  supabase: any,
  error?: string
): Promise<void> {
  try {
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
      throw updateError;
    } else {
      console.log(`Document ${documentId} status updated to: ${status}`);
    }
  } catch (error: any) {
    console.error(`Error updating document status:`, error);
    throw error;
  }
}

// Clean up failed document processing with better error handling
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
    // Don't throw - cleanup failure shouldn't prevent error reporting
  }
}
