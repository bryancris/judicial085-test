
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Enhanced embedding generation with better error handling
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
  const skipEmbeddings = !openaiApiKey || openaiApiKey.trim() === '';
  
  if (skipEmbeddings) {
    console.log('Skipping embedding generation (no API key provided)');
  }
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Enhanced chunk validation
      if (!chunk || chunk.trim().length < 5) {
        console.warn(`Skipping chunk ${i}: too short or empty`);
        continue;
      }
      
      // Clean chunk content
      const cleanedChunk = chunk.trim().substring(0, 8000); // Limit chunk size
      
      // Generate embedding (if API key available)
      let embedding: number[] = [];
      
      if (!skipEmbeddings) {
        try {
          embedding = await generateEmbedding(cleanedChunk, openaiApiKey);
          console.log(`Embedding generated for chunk ${i + 1} (${embedding.length} dimensions)`);
        } catch (embeddingError) {
          console.warn(`Failed to generate embedding for chunk ${i}:`, embeddingError);
          // Continue without embedding for this chunk
        }
      }
      
      // Store the chunk with enhanced metadata
      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          client_id: clientId,
          case_id: metadata.caseId,
          chunk_index: i,
          content: cleanedChunk,
          embedding: embedding.length > 0 ? embedding : null,
          metadata: {
            ...metadata,
            chunk_length: cleanedChunk.length,
            original_chunk_length: chunk.length,
            total_chunks: textChunks.length,
            word_count: cleanedChunk.split(/\s+/).length,
            content_type: 'pdf_document',
            has_embedding: embedding.length > 0,
            processing_timestamp: new Date().toISOString(),
            processing_method: metadata.extractionMethod || 'enhanced',
            chunk_quality_score: calculateChunkQuality(cleanedChunk)
          }
        });
      
      if (error) {
        console.error(`Failed to store chunk ${i}:`, error);
        // Continue with next chunk instead of failing completely
        continue;
      }
      
      successfulChunks++;
      console.log(`Successfully stored chunk ${i + 1}/${textChunks.length} ${embedding.length > 0 ? 'with embedding' : 'without embedding'}`);
      
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
  
  if (skipEmbeddings) {
    console.log('Note: Embeddings were skipped - search functionality may be limited');
  }
}

// Calculate a quality score for the chunk content
function calculateChunkQuality(content: string): number {
  try {
    const words = content.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !/^[^@]*@[^@]*$/.test(word) // Filter email artifacts
    );
    
    const ratio = meaningfulWords.length / words.length;
    const lengthScore = Math.min(content.length / 500, 1); // Prefer longer chunks up to 500 chars
    
    return Math.round((ratio * 0.7 + lengthScore * 0.3) * 100) / 100;
  } catch (error) {
    return 0.5; // Default quality score
  }
}

// Enhanced document status updates
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

// Enhanced cleanup with better error handling
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
