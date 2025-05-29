
// Extract text from PDF buffer using pdf-parse
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    // Import pdf-parse dynamically
    const { default: pdfParse } = await import('https://esm.sh/pdf-parse@1.1.1');
    
    console.log('Starting PDF text extraction...');
    const data = await pdfParse(pdfData);
    
    if (!data.text || data.text.trim() === '') {
      throw new Error('PDF contains no extractable text content');
    }
    
    console.log(`Successfully extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or not a valid PDF.');
    } else if (error.message?.includes('Password')) {
      throw new Error('Password-protected PDFs are not supported.');
    } else {
      throw new Error('Failed to extract text from PDF file. Please ensure the file is a valid, readable PDF.');
    }
  }
}

// Chunk document content
export function chunkDocument(content: string): string[] {
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
}
