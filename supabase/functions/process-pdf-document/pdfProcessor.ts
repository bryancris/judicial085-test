
// Simplified and robust PDF text extraction with proper error handling
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting simplified PDF text extraction...');
    
    // Strategy 1: Basic text extraction
    let extractedText = extractBasicText(pdfData);
    
    if (extractedText && extractedText.length > 30) {
      const cleanedText = cleanExtractedText(extractedText);
      if (cleanedText && cleanedText.length > 30) {
        console.log(`Basic extraction successful: ${cleanedText.length} characters`);
        return cleanedText;
      }
    }
    
    // Strategy 2: Pattern-based extraction
    extractedText = extractWithPatterns(pdfData);
    
    if (extractedText && extractedText.length > 30) {
      const cleanedText = cleanExtractedText(extractedText);
      if (cleanedText && cleanedText.length > 30) {
        console.log(`Pattern extraction successful: ${cleanedText.length} characters`);
        return cleanedText;
      }
    }
    
    // Fallback: Return placeholder text for indexing
    console.warn('Text extraction failed, using fallback content');
    return `Document uploaded: ${new Date().toISOString()}. Content requires manual review.`;
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    // Return fallback content instead of throwing
    return `Document uploaded: ${new Date().toISOString()}. Content extraction failed but document is available.`;
  }
}

function extractBasicText(pdfData: Uint8Array): string {
  try {
    // Use a safe text decoder with error handling
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(pdfData);
    
    // Extract text between common PDF text markers
    const textLines: string[] = [];
    const lines = text.split(/[\r\n]+/);
    
    for (const line of lines) {
      // Look for readable text lines
      if (line.length > 5 && /[a-zA-Z]/.test(line)) {
        // Remove PDF commands and non-printable characters
        const cleaned = line
          .replace(/[^\x20-\x7E\s]/g, ' ') // Keep only printable ASCII
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleaned.length > 5) {
          textLines.push(cleaned);
        }
      }
    }
    
    return textLines.join(' ').trim();
  } catch (error) {
    console.warn('Basic text extraction failed:', error);
    return '';
  }
}

function extractWithPatterns(pdfData: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(pdfData);
    
    const extractedParts: string[] = [];
    
    // Email patterns
    const emailPatterns = [
      /(?:from|to|subject):\s*([^\r\n]+)/gi,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    ];
    
    // Content patterns
    const contentPatterns = [
      /[A-Z][a-zA-Z\s]{10,}[.!?]/g,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\$[\d,]+\.?\d*/g,
    ];
    
    // Apply patterns
    for (const pattern of [...emailPatterns, ...contentPatterns]) {
      const matches = text.match(pattern) || [];
      for (const match of matches) {
        const cleaned = match.replace(/[^\x20-\x7E\s]/g, ' ').trim();
        if (cleaned.length > 3) {
          extractedParts.push(cleaned);
        }
      }
    }
    
    return extractedParts.join(' ').trim();
  } catch (error) {
    console.warn('Pattern extraction failed:', error);
    return '';
  }
}

function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  try {
    // Basic cleaning
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .trim();
    
    // Remove excessive repetition
    cleaned = cleaned.replace(/(\b\w+\b)(\s+\1){3,}/g, '$1');
    
    // Ensure minimum quality
    const words = cleaned.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && /^[a-zA-Z]/.test(word)
    );
    
    if (meaningfulWords.length < 3) {
      return '';
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Text cleaning failed:', error);
    return text;
  }
}

// Simplified chunking with error handling
export function chunkDocument(content: string): string[] {
  try {
    console.log(`Starting chunking for ${content.length} characters`);
    
    if (content.length < 50) {
      console.warn('Content too short for chunking, returning as single chunk');
      return [content];
    }
    
    const MAX_CHUNK_SIZE = 1000;
    const chunks: string[] = [];
    
    // Simple sentence-based chunking
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      // Fallback to character-based chunking
      for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
        chunks.push(content.slice(i, i + MAX_CHUNK_SIZE));
      }
    } else {
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim() + '.';
        
        if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 100) {
          chunks.push(currentChunk.trim());
          currentChunk = trimmed;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + trimmed;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
    
    const validChunks = chunks.filter(chunk => chunk.length > 20);
    
    if (validChunks.length === 0) {
      console.warn('No valid chunks created, returning original content');
      return [content];
    }
    
    console.log(`Chunking completed: ${validChunks.length} chunks created`);
    return validChunks;
    
  } catch (error: any) {
    console.error('Chunking error:', error);
    // Return original content as fallback
    return [content];
  }
}
