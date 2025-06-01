
// Helper function to chunk document content
export const chunkDocument = (content: string): string[] => {
  const MAX_CHUNK_LENGTH = 1000;
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    if (currentChunk.length > 0) {
      currentChunk += '\n\n' + paragraph;
    } else {
      currentChunk = paragraph;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};
