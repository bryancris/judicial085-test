

// Extract text from PDF buffer using a Deno-compatible approach
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Try to use pdf2pic or a simpler text extraction method
    // For now, let's use a basic approach with pdf-lib which is more Deno-friendly
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfData);
    const pages = pdfDoc.getPages();
    
    console.log(`PDF loaded successfully with ${pages.length} pages`);
    
    let fullText = '';
    
    // For pdf-lib, we need to use a different approach since it doesn't have built-in text extraction
    // Let's try a workaround using a different library
    try {
      // Use pdf-parse with a fallback approach
      const response = await fetch('https://deno.land/x/pdf_parse@1.0.0/mod.ts');
      if (response.ok) {
        const { default: pdfParse } = await import('https://deno.land/x/pdf_parse@1.0.0/mod.ts');
        const data = await pdfParse(pdfData);
        
        if (data.text && data.text.trim()) {
          fullText = data.text.trim();
          console.log(`Successfully extracted ${fullText.length} characters from ${data.numpages} pages`);
          return fullText;
        }
      }
    } catch (parseError) {
      console.warn('pdf-parse failed, trying alternative approach:', parseError);
    }
    
    // Fallback: Try to extract basic text information from PDF structure
    // This is a very basic approach but should work for simple PDFs
    const pdfBytes = Array.from(pdfData);
    const pdfString = String.fromCharCode(...pdfBytes);
    
    // Look for text content patterns in the PDF
    const textMatches = pdfString.match(/\((.*?)\)/g);
    if (textMatches && textMatches.length > 0) {
      fullText = textMatches
        .map(match => match.slice(1, -1)) // Remove parentheses
        .filter(text => text.length > 1 && /[a-zA-Z]/.test(text)) // Filter out non-text
        .join(' ')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    }
    
    if (!fullText || fullText.length < 10) {
      // Try another pattern for text extraction
      const streamMatches = pdfString.match(/stream\s*(.*?)\s*endstream/gs);
      if (streamMatches) {
        const textContent = streamMatches
          .map(match => {
            // Extract readable text from stream content
            const content = match.replace(/^stream\s*|\s*endstream$/g, '');
            return content.replace(/[^\x20-\x7E]/g, ' '); // Keep only printable ASCII
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent.length > fullText.length) {
          fullText = textContent;
        }
      }
    }
    
    if (!fullText || fullText.length < 10) {
      throw new Error('PDF contains no extractable text content');
    }
    
    console.log(`Successfully extracted ${fullText.length} characters using fallback method`);
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

