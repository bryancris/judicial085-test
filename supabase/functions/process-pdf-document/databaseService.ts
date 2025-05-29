
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Generate embeddings and store chunks with proper validation
export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} text chunks`);
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Basic validation
      if (!chunk || chunk.trim().length < 50) {
        console.warn(`Skipping chunk ${i}: too short or empty`);
        continue;
      }
      
      // Check for meaningful content
      const isValid = validateChunk(chunk);
      if (!isValid) {
        console.warn(`Skipping chunk ${i}: failed validation`);
        continue;
      }
      
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
            total_chunks: textChunks.length,
            word_count: chunk.split(/\s+/).length,
            content_type: 'document',
            validated: true
          }
        });
      
      if (error) {
        throw new Error(`Failed to store chunk ${i}: ${error.message}`);
      }
      
      console.log(`Successfully stored chunk ${i + 1}/${textChunks.length}`);
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      throw error;
    }
  }
  
  console.log(`Successfully generated and stored embeddings for ${textChunks.length} chunks`);
}

// Validate if chunk contains meaningful content
function validateChunk(chunk: string): boolean {
  if (!chunk || chunk.length < 50) return false;
  
  // Check for readable content ratio
  const alphaChars = (chunk.match(/[a-zA-Z]/g) || []).length;
  const totalChars = chunk.length;
  const alphaRatio = alphaChars / totalChars;
  
  // Must be at least 40% alphabetic characters
  if (alphaRatio < 0.4) {
    console.log(`Chunk failed alpha ratio test: ${alphaRatio}`);
    return false;
  }
  
  // Check for word diversity
  const words = chunk.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversityRatio = uniqueWords.size / words.length;
  
  if (diversityRatio < 0.3) {
    console.log(`Chunk failed diversity test: ${diversityRatio}`);
    return false;
  }
  
  // Check for garbage patterns
  const garbagePatterns = [
    /^[^a-zA-Z\s]{30,}/,        // Long strings without letters
    /^[0-9\W\s]{100,}$/,        // Mostly numbers and symbols
    /^[A-F0-9\s]{50,}$/i,       // Hex-like patterns
    /%PDF-/gi,                  // PDF headers
    /stream.*endstream/gi,      // PDF stream objects
  ];
  
  for (const pattern of garbagePatterns) {
    if (pattern.test(chunk)) {
      console.log(`Chunk failed garbage pattern test: ${pattern}`);
      return false;
    }
  }
  
  // Must have at least some sentence-like structure
  const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length === 0) {
    console.log('Chunk has no sentence structure');
    return false;
  }
  
  console.log(`Chunk validation passed: ${alphaRatio} alpha ratio, ${diversityRatio} diversity ratio`);
  return true;
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
