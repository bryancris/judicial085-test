
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

interface ChunkMetadata {
  fileName: string;
  fileUrl: string;
  extractionMethod: string;
  quality: number;
  confidence: number;
  pageCount: number;
}

export async function generateAndStoreEmbeddings(
  chunks: string[],
  documentId: string,
  clientId: string,
  caseId: string | null,
  supabase: any,
  openaiApiKey: string,
  metadata: ChunkMetadata
): Promise<void> {
  console.log(`Generating embeddings for ${chunks.length} text chunks with advanced validation`);
  
  // Get existing document to preserve URL
  const { data: existingDoc } = await supabase
    .from('document_metadata')
    .select('url')
    .eq('id', documentId)
    .single();
  
  const existingUrl = existingDoc?.url;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkIndex = i + 1;
    
    console.log(`Processing chunk ${chunkIndex}/${chunks.length} (${chunk.length} chars)`);
    
    // Calculate quality score for this chunk
    const quality = calculateChunkQuality(chunk);
    console.log(`Chunk ${chunkIndex} quality score: ${quality}`);
    
    try {
      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: chunk,
          model: 'text-embedding-3-small',
          dimensions: 1536
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        throw new Error(`OpenAI API error: ${embeddingResponse.status} - ${errorText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      
      console.log(`Embedding generated for chunk ${chunkIndex} (${embedding.length} dimensions)`);

      // Store chunk with embedding
      const chunkMetadata = {
        fileName: metadata.fileName,
        fileUrl: metadata.fileUrl,
        extractionMethod: metadata.extractionMethod,
        quality: metadata.quality,
        confidence: metadata.confidence,
        pageCount: metadata.pageCount,
        chunkQuality: quality,
        isPdfDocument: true,
        fileType: 'pdf'
      };

      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          id: crypto.randomUUID(),
          document_id: documentId,
          client_id: clientId,
          case_id: caseId,
          chunk_index: chunkIndex,
          content: chunk,
          embedding: embedding,
          metadata: chunkMetadata
        });

      if (chunkError) {
        console.error(`Failed to store chunk ${chunkIndex}:`, chunkError);
        throw chunkError;
      }

      console.log(`Successfully stored chunk ${chunkIndex}/${chunks.length} with embedding (quality: ${quality})`);
      
    } catch (error) {
      console.error(`Error processing chunk ${chunkIndex}:`, error);
      throw error;
    }
  }
  
  console.log(`Successfully stored ${chunks.length}/${chunks.length} chunks`);
  
  // Update document metadata with final status while preserving URL
  const finalUpdateData: any = {
    processing_status: 'completed',
    processed_at: new Date().toISOString(),
    processing_notes: `Successfully processed with advanced library and OCR extraction strategy`
  };
  
  // CRITICAL: Preserve the existing URL
  if (existingUrl) {
    finalUpdateData.url = existingUrl;
  }
  
  const { error: finalUpdateError } = await supabase
    .from('document_metadata')
    .update(finalUpdateData)
    .eq('id', documentId);
  
  if (finalUpdateError) {
    console.error('Failed to update final document status:', finalUpdateError);
    throw finalUpdateError;
  }
  
  console.log('Advanced processing completed with embeddings for search functionality');
}

function calculateChunkQuality(chunk: string): number {
  if (!chunk || chunk.length < 10) return 0;
  
  const words = chunk.split(/\s+/);
  const totalWords = words.length;
  
  if (totalWords === 0) return 0;
  
  // Count meaningful words
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word) &&
    !/@/.test(word)
  );
  
  // Count sentences
  const sentences = chunk.match(/[.!?]+/g) || [];
  
  // Calculate quality metrics
  const meaningfulRatio = meaningfulWords.length / totalWords;
  const sentenceBonus = Math.min(sentences.length / 5, 0.2);
  const lengthBonus = Math.min(chunk.length / 1000, 0.3);
  
  const quality = meaningfulRatio * 0.6 + sentenceBonus + lengthBonus;
  
  return Math.max(0, Math.min(1, quality));
}
