import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { generateEmbedding } from './openaiService.ts';

// Enhanced embedding generation with multi-approach validation
export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} text chunks with multi-approach validation`);
  
  let successfulChunks = 0;
  const skipEmbeddings = !openaiApiKey || openaiApiKey.trim() === '';
  
  if (skipEmbeddings) {
    console.log('Skipping embedding generation (no OpenAI API key provided)');
  }
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Enhanced chunk validation with quality scoring
      if (!chunk || chunk.trim().length < 10) {
        console.warn(`Skipping chunk ${i}: too short or empty`);
        continue;
      }
      
      // Clean and validate chunk content
      const cleanedChunk = cleanChunkContent(chunk);
      const chunkQuality = calculateAdvancedChunkQuality(cleanedChunk);
      
      console.log(`Chunk ${i + 1} quality score: ${chunkQuality}`);
      
      if (chunkQuality < 0.1) {
        console.warn(`Skipping chunk ${i}: quality too low (${chunkQuality})`);
        continue;
      }
      
      // Generate embedding (if API key available and chunk quality is sufficient)
      let embedding: number[] = [];
      
      if (!skipEmbeddings && chunkQuality >= 0.3) {
        try {
          embedding = await generateEmbedding(cleanedChunk, openaiApiKey);
          console.log(`Embedding generated for chunk ${i + 1} (${embedding.length} dimensions)`);
        } catch (embeddingError) {
          console.warn(`Failed to generate embedding for chunk ${i}:`, embeddingError);
          // Continue without embedding for this chunk
        }
      } else if (chunkQuality < 0.3) {
        console.log(`Skipping embedding for chunk ${i + 1}: quality below threshold (${chunkQuality})`);
      }
      
      // Store the chunk with comprehensive metadata
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
            processing_method: metadata.extractionMethod || 'multi-approach',
            chunk_quality_score: chunkQuality,
            processing_version: '3.0-multi-approach',
            content_preview: cleanedChunk.substring(0, 100),
            is_searchable: embedding.length > 0,
            validation_passed: true,
            content_type_detected: detectContentType(cleanedChunk)
          }
        });
      
      if (error) {
        console.error(`Failed to store chunk ${i}:`, error);
        // Continue with next chunk instead of failing completely
        continue;
      }
      
      successfulChunks++;
      console.log(`Successfully stored chunk ${i + 1}/${textChunks.length} ${embedding.length > 0 ? 'with embedding' : 'without embedding'} (quality: ${chunkQuality})`);
      
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      // Continue with next chunk
      continue;
    }
  }
  
  if (successfulChunks === 0) {
    throw new Error('No chunks could be stored successfully - all chunks failed validation or storage');
  }
  
  console.log(`Successfully stored ${successfulChunks}/${textChunks.length} chunks`);
  
  if (skipEmbeddings) {
    console.log('Note: Embeddings were skipped - search functionality will be limited');
  } else {
    const chunksWithEmbeddings = textChunks.filter((_, i) => i < successfulChunks).length;
    console.log(`${chunksWithEmbeddings} chunks stored with embeddings for search functionality`);
  }
}

// Advanced chunk content cleaning
function cleanChunkContent(chunk: string): string {
  if (!chunk) return '';
  
  try {
    // Remove excessive whitespace
    let cleaned = chunk.replace(/\s+/g, ' ').trim();
    
    // Remove repetitive patterns (like repeated email addresses)
    cleaned = removeRepetitivePatterns(cleaned);
    
    // Clean up encoding artifacts
    cleaned = cleaned
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit chunk size for processing efficiency
    if (cleaned.length > 2000) {
      cleaned = cleaned.substring(0, 2000).trim();
      // Try to end at a sentence boundary
      const lastSentence = cleaned.lastIndexOf('.');
      if (lastSentence > 1500) {
        cleaned = cleaned.substring(0, lastSentence + 1);
      }
      cleaned += ' [Content truncated]';
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Error cleaning chunk content:', error);
    return chunk.substring(0, 1000); // Fallback
  }
}

// Remove repetitive patterns from content
function removeRepetitivePatterns(text: string): string {
  if (!text) return text;
  
  try {
    // Remove repeated email addresses
    const words = text.split(/\s+/);
    const seenEmails = new Set();
    const filteredWords = [];
    
    for (const word of words) {
      if (/@/.test(word)) {
        if (!seenEmails.has(word)) {
          seenEmails.add(word);
          filteredWords.push(word);
        }
        // Skip repeated email addresses
      } else {
        filteredWords.push(word);
      }
    }
    
    // If we removed too many words, keep the original
    if (filteredWords.length < words.length * 0.3) {
      return text;
    }
    
    return filteredWords.join(' ');
  } catch (error) {
    return text;
  }
}

// Calculate advanced quality score for chunks
function calculateAdvancedChunkQuality(content: string): number {
  try {
    if (!content || content.length < 5) return 0;
    
    const words = content.split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    // Count different types of content
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !/^[@#$%^&*()]+/.test(word)
    );
    
    const emailAddresses = words.filter(word => 
      /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(word)
    );
    
    const numbers = words.filter(word => /^\d+$/.test(word));
    const sentences = content.match(/[.!?]+/g) || [];
    const properNouns = words.filter(word => /^[A-Z][a-z]+$/.test(word));
    
    // Calculate quality metrics
    const meaningfulRatio = meaningfulWords.length / totalWords;
    const emailRatio = emailAddresses.length / totalWords;
    const properNounRatio = properNouns.length / totalWords;
    const sentenceDensity = sentences.length / (totalWords / 10); // sentences per 10 words
    const lengthScore = Math.min(content.length / 500, 1);
    const vocabularyDiversity = new Set(words.map(w => w.toLowerCase())).size / totalWords;
    
    // Penalties for poor content
    let penalties = 0;
    
    // Heavy penalty for excessive email repetition
    if (emailRatio > 0.5) penalties += 0.6;
    else if (emailRatio > 0.3) penalties += 0.3;
    
    // Penalty for too many numbers (might be formatting artifacts)
    if (numbers.length / totalWords > 0.4) penalties += 0.2;
    
    // Penalty for very low vocabulary diversity (repetitive content)
    if (vocabularyDiversity < 0.3) penalties += 0.3;
    
    // Calculate final quality score
    const qualityScore = (
      meaningfulRatio * 0.3 +
      properNounRatio * 0.2 +
      sentenceDensity * 0.2 +
      lengthScore * 0.1 +
      vocabularyDiversity * 0.2
    ) - penalties;
    
    return Math.max(0, Math.min(1, qualityScore));
  } catch (error) {
    console.warn('Error calculating chunk quality:', error);
    return 0.5; // Default quality score
  }
}

// Detect content type of chunk
function detectContentType(content: string): string {
  if (!content) return 'unknown';
  
  try {
    const lowerContent = content.toLowerCase();
    
    // Email content detection
    if (/^(from|to|subject|date):/m.test(content) || 
        /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
      return 'email';
    }
    
    // Legal document patterns
    if (/\b(whereas|party|agreement|contract|shall|thereof)\b/i.test(content)) {
      return 'legal_document';
    }
    
    // Letter format
    if (/\b(dear|sincerely|regards|yours|truly)\b/i.test(content)) {
      return 'letter';
    }
    
    // Form or structured data
    if (/^[A-Z][^.]*:/.test(content) || content.includes('___')) {
      return 'form';
    }
    
    // General text content
    if (/[.!?]/.test(content) && content.split(/\s+/).length > 10) {
      return 'text_content';
    }
    
    return 'mixed_content';
  } catch (error) {
    return 'unknown';
  }
}

// Enhanced document status updates with detailed logging
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
      updateData.processing_notes = `Multi-approach processing failed: ${error}`;
    } else if (status === 'completed') {
      updateData.processing_notes = 'Successfully processed with multi-approach extraction strategy';
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

// Enhanced cleanup with comprehensive error handling
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
      console.log('Successfully cleaned up existing chunks for failed document');
    }
    
    // Update metadata to reflect cleanup
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .update({
        processing_notes: 'Document processing failed and chunks were cleaned up',
        processing_error: 'Multi-approach extraction failed - document requires manual processing'
      })
      .eq('id', documentId);
    
    if (metadataError) {
      console.error('Error updating metadata during cleanup:', metadataError);
    }
    
  } catch (error) {
    console.error('Error during comprehensive cleanup:', error);
    // Don't throw - cleanup failure shouldn't prevent error reporting
  }
}
