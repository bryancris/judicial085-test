
// Extract text from PDF buffer using pdfjs-dist
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    // Import pdfjs-dist dynamically for Deno compatibility
    const { getDocument, GlobalWorkerOptions } = await import('https://cdn.skypack.dev/pdfjs-dist@3.11.174');
    
    console.log('Starting PDF text extraction with pdfjs-dist...');
    
    // Load the PDF document
    const loadingTask = getDocument({
      data: pdfData,
      useSystemFonts: true,
      standardFontDataUrl: 'https://cdn.skypack.dev/pdfjs-dist@3.11.174/standard_fonts/',
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    console.log(`PDF loaded successfully with ${numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
        
        console.log(`Extracted text from page ${pageNum}/${numPages}`);
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    // Clean up the extracted text
    fullText = fullText.trim();
    
    if (!fullText || fullText.length === 0) {
      throw new Error('PDF contains no extractable text content');
    }
    
    console.log(`Successfully extracted ${fullText.length} characters from ${numPages} pages`);
    return fullText;
    
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or not a valid PDF.');
    } else if (error.message?.includes('Password')) {
      throw new Error('Password-protected PDFs are not supported.');
    } else if (error.message?.includes('no extractable text')) {
      throw new Error('PDF contains no extractable text content. This may be a scanned document or image-based PDF.');
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
