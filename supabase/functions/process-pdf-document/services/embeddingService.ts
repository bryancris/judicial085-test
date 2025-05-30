
import { generateEmbedding } from '../openaiService.ts';

export async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {},
  supabase: any,
  openaiApiKey: string
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} text chunks with advanced validation`);
  
  let successfulChunks = 0;
  const skipEmbeddings = !openaiApiKey || openaiApiKey.trim() === '';
  
  if (skipEmbeddings) {
    console.log('Skipping embedding generation (no OpenAI API key provided)');
  }
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} chars)`);
      
      // Advanced chunk validation and cleaning
      if (!chunk || chunk.trim().length < 10) {
        console.warn(`Skipping chunk ${i}: too short or empty`);
        continue;
      }
      
      // Clean and validate chunk content with null-byte removal
      const cleanedChunk = cleanChunkContentAdvanced(chunk);
      const chunkQuality = calculateAdvancedChunkQuality(cleanedChunk);
      
      console.log(`Chunk ${i + 1} quality score: ${chunkQuality}`);
      
      if (chunkQuality < 0.1) {
        console.warn(`Skipping chunk ${i}: quality too low (${chunkQuality})`);
        continue;
      }
      
      // Generate embedding (if API key available and chunk quality is sufficient)
      let embedding: number[] = [];
      
      if (!skipEmbeddings && chunkQuality >= 0.25) {
        try {
          embedding = await generateEmbedding(cleanedChunk, openaiApiKey);
          console.log(`Embedding generated for chunk ${i + 1} (${embedding.length} dimensions)`);
        } catch (embeddingError) {
          console.warn(`Failed to generate embedding for chunk ${i}:`, embeddingError);
          // Continue without embedding for this chunk
        }
      } else if (chunkQuality < 0.25) {
        console.log(`Skipping embedding for chunk ${i + 1}: quality below threshold (${chunkQuality})`);
      }
      
      // Store the chunk with comprehensive metadata and advanced processing info
      const chunkMetadata = {
        ...metadata,
        chunk_length: cleanedChunk.length,
        original_chunk_length: chunk.length,
        total_chunks: textChunks.length,
        word_count: cleanedChunk.split(/\s+/).length,
        content_type: metadata.contentType || 'pdf_document',
        has_embedding: embedding.length > 0,
        processing_timestamp: new Date().toISOString(),
        processing_method: metadata.extractionMethod || 'advanced-processing',
        chunk_quality_score: chunkQuality,
        processing_version: '4.0-advanced-library-ocr',
        content_preview: cleanedChunk.substring(0, 100),
        is_searchable: embedding.length > 0,
        validation_passed: true,
        content_type_detected: detectContentType(cleanedChunk),
        is_scanned_document: metadata.isScannedDocument || false,
        extraction_confidence: metadata.extractionConfidence || 1.0,
        advanced_processing: true
      };
      
      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          client_id: clientId,
          case_id: metadata.caseId,
          chunk_index: i,
          content: cleanedChunk,
          embedding: embedding.length > 0 ? embedding : null,
          metadata: chunkMetadata
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
    console.log(`Advanced processing completed with embeddings for search functionality`);
  }
}

// Enhanced chunk content cleaning with better null-byte removal
function cleanChunkContentAdvanced(chunk: string): string {
  if (!chunk) return '';
  
  try {
    // Comprehensive cleaning for better database compatibility
    let cleaned = chunk
      .replace(/\0/g, '') // Remove null bytes completely
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/\uFFFD/g, ' ') // Remove replacement characters
      .replace(/[^\x20-\x7E\s\t\n\r]/g, ' ') // Keep only safe ASCII + whitespace
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Remove repetitive patterns more effectively
    cleaned = removeRepetitivePatternsEnhanced(cleaned);
    
    // Limit and clean chunk size
    if (cleaned.length > 2000) {
      cleaned = cleaned.substring(0, 2000).trim();
      // Try to end at a sentence boundary
      const lastSentence = cleaned.lastIndexOf('.');
      if (lastSentence > 1500) {
        cleaned = cleaned.substring(0, lastSentence + 1);
      }
      cleaned += ' [Content truncated for processing efficiency]';
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Error cleaning chunk content:', error);
    // Ultra-safe fallback
    return chunk
      .replace(/\0/g, '')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 1000)
      .trim();
  }
}

// Enhanced pattern removal
function removeRepetitivePatternsEnhanced(text: string): string {
  if (!text) return text;
  
  try {
    const words = text.split(/\s+/);
    const seenPatterns = new Set();
    const filteredWords = [];
    
    for (const word of words) {
      // Remove repeated email addresses
      if (/@/.test(word)) {
        if (!seenPatterns.has(word)) {
          seenPatterns.add(word);
          filteredWords.push(word);
        }
        continue;
      }
      
      // Remove repeated PDF artifacts
      if (/^(obj|endobj|stream|endstream|filter|length|xref)$/i.test(word)) {
        continue;
      }
      
      // Remove repeated numeric patterns
      if (/^\d+$/.test(word) && word.length > 5) {
        continue;
      }
      
      filteredWords.push(word);
    }
    
    // If we removed too many words, return original
    if (filteredWords.length < words.length * 0.3) {
      return text;
    }
    
    return filteredWords.join(' ');
  } catch (error) {
    return text;
  }
}

// Enhanced quality calculation for better scoring
function calculateAdvancedChunkQuality(content: string): number {
  try {
    if (!content || content.length < 10) return 0;
    
    const words = content.split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords === 0) return 0;
    
    // Enhanced content analysis
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !/^(obj|endobj|stream|endstream|filter|length|xref)$/i.test(word)
    );
    
    const emailAddresses = words.filter(word => 
      /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(word)
    );
    
    const legalTerms = words.filter(word =>
      /^(discovery|request\s+for\s+production|interrogator|deposition|motion|brief|complaint|whereas|party|agreement|contract|shall|thereof)\b/i.test(word)
    );
    
    const sentences = content.match(/[.!?]+/g) || [];
    const properNouns = words.filter(word => /^[A-Z][a-z]+$/.test(word));
    
    // Calculate enhanced metrics
    const meaningfulRatio = meaningfulWords.length / totalWords;
    const legalTermRatio = legalTerms.length / totalWords;
    const emailRatio = emailAddresses.length / totalWords;
    const properNounRatio = properNouns.length / totalWords;
    const sentenceDensity = sentences.length / Math.max(1, totalWords / 10);
    const lengthScore = Math.min(content.length / 800, 1);
    const vocabularyDiversity = new Set(words.map(w => w.toLowerCase())).size / totalWords;
    
    // Enhanced penalties
    let penalties = 0;
    
    // Heavy penalty for excessive repetition
    if (emailRatio > 0.4) penalties += 0.5;
    else if (emailRatio > 0.2) penalties += 0.2;
    
    // Penalty for PDF artifacts
    const artifactWords = words.filter(w => 
      /^(obj|endobj|stream|endstream|filter|flatedecode|length|xref|\d+)$/i.test(w)
    );
    const artifactRatio = artifactWords.length / totalWords;
    if (artifactRatio > 0.3) penalties += 0.4;
    
    // Penalty for low vocabulary diversity
    if (vocabularyDiversity < 0.2) penalties += 0.3;
    
    // Bonus for legal content
    let bonuses = 0;
    if (legalTermRatio > 0.02) bonuses += 0.2;
    if (properNounRatio > 0.1) bonuses += 0.1;
    
    // Calculate final quality score
    const qualityScore = (
      meaningfulRatio * 0.3 +
      legalTermRatio * 0.2 +
      properNounRatio * 0.15 +
      sentenceDensity * 0.15 +
      lengthScore * 0.1 +
      vocabularyDiversity * 0.1 +
      bonuses
    ) - penalties;
    
    return Math.max(0, Math.min(1, qualityScore));
  } catch (error) {
    console.warn('Error calculating chunk quality:', error);
    return 0.4; // Safe default
  }
}

// Enhanced content type detection
function detectContentType(content: string): string {
  if (!content) return 'unknown';
  
  try {
    const lowerContent = content.toLowerCase();
    
    // Enhanced email detection
    if (/^(from|to|subject|date|sent):/m.test(content) || 
        (content.includes('@') && /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content))) {
      return 'email';
    }
    
    // Enhanced legal document detection
    if (/\b(discovery|request\s+for\s+production|interrogator|deposition|motion|brief|complaint|whereas|party|agreement|contract|shall|thereof)\b/i.test(content)) {
      return 'legal_document';
    }
    
    // Court document detection
    if (/\b(court|case\s+no|docket|filing|petition|order)\b/i.test(content)) {
      return 'court_document';
    }
    
    // Correspondence detection
    if (/\b(dear|sincerely|regards|yours\s+truly|respectfully)\b/i.test(content)) {
      return 'correspondence';
    }
    
    // Form detection
    if (/^[A-Z][^.]*:/.test(content) || content.includes('___') || /\[\s*\]/.test(content)) {
      return 'form';
    }
    
    // General text content
    if (/[.!?]/.test(content) && content.split(/\s+/).length > 15) {
      return 'text_document';
    }
    
    return 'mixed_content';
  } catch (error) {
    return 'unknown';
  }
}
