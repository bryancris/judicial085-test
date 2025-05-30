
// Document chunking utilities with proper 500-token chunks and 100-token overlap

export function chunkDocumentAdvanced(content: string, metadata: any = {}): string[] {
  console.log(`=== STARTING ENHANCED DOCUMENT CHUNKING: ${content.length} characters ===`);
  
  // Skip chunking for analysis summaries
  if (content.includes("ENHANCED DOCUMENT ANALYSIS") || content.includes("ANALYSIS SUMMARY")) {
    console.log('Using document analysis content as single chunk');
    return [content];
  }
  
  if (content.length < 150) {
    console.log('Content too short for chunking');
    return [content];
  }
  
  // PROPER TOKEN-BASED CHUNKING (GPT-4 tokenization: ~4 chars = 1 token)
  const CHARS_PER_TOKEN = 4;
  const MAX_TOKENS = 500;
  const OVERLAP_TOKENS = 100;
  
  const MAX_CHUNK_SIZE = MAX_TOKENS * CHARS_PER_TOKEN; // 2000 characters
  const OVERLAP_SIZE = OVERLAP_TOKENS * CHARS_PER_TOKEN; // 400 characters
  
  console.log(`Enhanced chunking parameters:`);
  console.log(`- Max chunk size: ${MAX_CHUNK_SIZE} chars (~${MAX_TOKENS} tokens)`);
  console.log(`- Overlap size: ${OVERLAP_SIZE} chars (~${OVERLAP_TOKENS} tokens)`);
  console.log(`- Content length: ${content.length} chars`);
  
  const chunks: string[] = [];
  let startIndex = 0;
  let chunkNumber = 1;
  
  while (startIndex < content.length) {
    let endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, content.length);
    
    // Smart break point detection for better context preservation
    if (endIndex < content.length) {
      // Priority order for break points
      const sentenceBreak = findLastOccurrence(content, ['.', '!', '?'], endIndex, startIndex + (MAX_CHUNK_SIZE * 0.7));
      const paragraphBreak = findLastOccurrence(content, ['\n\n'], endIndex, startIndex + (MAX_CHUNK_SIZE * 0.6));
      const lineBreak = findLastOccurrence(content, ['\n'], endIndex, startIndex + (MAX_CHUNK_SIZE * 0.8));
      const spaceBreak = findLastOccurrence(content, [' '], endIndex, startIndex + (MAX_CHUNK_SIZE * 0.9));
      
      // Choose the best break point
      if (sentenceBreak > -1) {
        endIndex = sentenceBreak + 1;
        console.log(`Chunk ${chunkNumber}: Using sentence break at position ${endIndex}`);
      } else if (paragraphBreak > -1) {
        endIndex = paragraphBreak + 2;
        console.log(`Chunk ${chunkNumber}: Using paragraph break at position ${endIndex}`);
      } else if (lineBreak > -1) {
        endIndex = lineBreak + 1;
        console.log(`Chunk ${chunkNumber}: Using line break at position ${endIndex}`);
      } else if (spaceBreak > -1) {
        endIndex = spaceBreak + 1;
        console.log(`Chunk ${chunkNumber}: Using space break at position ${endIndex}`);
      } else {
        console.log(`Chunk ${chunkNumber}: Using hard break at position ${endIndex}`);
      }
    }
    
    const chunk = content.substring(startIndex, endIndex).trim();
    
    if (chunk.length > 100) { // Only include substantial chunks
      // Add chunk metadata for better context
      const chunkWithContext = addChunkContext(chunk, chunkNumber, chunks.length + 1, metadata);
      chunks.push(chunkWithContext);
      
      console.log(`Created chunk ${chunkNumber}:`);
      console.log(`- Length: ${chunk.length} chars (~${Math.round(chunk.length / CHARS_PER_TOKEN)} tokens)`);
      console.log(`- Start position: ${startIndex}`);
      console.log(`- End position: ${endIndex}`);
      console.log(`- Preview: "${chunk.substring(0, 100)}..."`);
      
      chunkNumber++;
    }
    
    // Calculate next start position with overlap
    if (endIndex >= content.length) break;
    
    // Ensure proper overlap while avoiding infinite loops
    const nextStart = Math.max(
      endIndex - OVERLAP_SIZE,                    // Desired overlap
      startIndex + (MAX_CHUNK_SIZE * 0.5),      // Minimum progress
      startIndex + 200                           // Absolute minimum progress
    );
    
    startIndex = nextStart;
    
    console.log(`Next chunk will start at position ${startIndex} (overlap: ${endIndex - startIndex} chars)`);
  }
  
  console.log(`✅ Enhanced chunking completed: ${chunks.length} chunks created`);
  console.log(`Total chunks: ${chunks.length}, average size: ${Math.round(content.length / chunks.length)} chars`);
  
  return chunks.length > 0 ? chunks : [content];
}

// Helper function to find the last occurrence of any delimiter within a range
function findLastOccurrence(text: string, delimiters: string[], endIndex: number, minIndex: number): number {
  let lastIndex = -1;
  
  for (const delimiter of delimiters) {
    const index = text.lastIndexOf(delimiter, endIndex - 1);
    if (index >= minIndex && index > lastIndex) {
      lastIndex = index;
    }
  }
  
  return lastIndex;
}

// Add context to chunks for better processing
function addChunkContext(chunk: string, chunkNumber: number, totalChunks: number, metadata: any): string {
  // For legal documents, add minimal context header
  const isLegalContent = /REQUEST|DISCOVERY|COURT|CASE|DEFENDANT|PLAINTIFF/i.test(chunk);
  
  if (isLegalContent && chunkNumber > 1) {
    return `[Legal Document - Part ${chunkNumber}/${totalChunks}]\n\n${chunk}`;
  }
  
  return chunk;
}
