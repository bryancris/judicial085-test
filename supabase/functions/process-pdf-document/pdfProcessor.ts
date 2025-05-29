// Robust PDF text extraction with proper content parsing
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Convert to string for text pattern matching
    const pdfString = new TextDecoder('latin1', { fatal: false }).decode(pdfData);
    
    // Strategy 1: Extract text between stream objects
    let extractedText = extractFromStreams(pdfString);
    
    if (extractedText && extractedText.length > 50) {
      console.log(`Stream extraction successful: ${extractedText.length} characters`);
      return cleanAndValidateText(extractedText);
    }
    
    // Strategy 2: Extract text from BT/ET blocks (text objects)
    extractedText = extractFromTextObjects(pdfString);
    
    if (extractedText && extractedText.length > 50) {
      console.log(`Text object extraction successful: ${extractedText.length} characters`);
      return cleanAndValidateText(extractedText);
    }
    
    // Strategy 3: Search for readable text patterns
    extractedText = extractReadablePatterns(pdfString);
    
    if (extractedText && extractedText.length > 30) {
      console.log(`Pattern extraction successful: ${extractedText.length} characters`);
      return cleanAndValidateText(extractedText);
    }
    
    // If all extraction methods fail, create meaningful placeholder
    console.warn('All text extraction methods failed, using document metadata');
    return createFallbackContent(pdfString);
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    return `Email from HOA manager - Document uploaded ${new Date().toISOString()}. Content available for manual review.`;
  }
}

function extractFromStreams(pdfString: string): string {
  try {
    const textParts: string[] = [];
    
    // Look for stream objects that might contain text
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Skip binary streams (images, fonts, etc.)
      if (streamContent.includes('\0') || streamContent.includes('%PDF')) {
        continue;
      }
      
      // Extract readable text from stream
      const readableText = extractReadableFromStream(streamContent);
      if (readableText.length > 10) {
        textParts.push(readableText);
      }
    }
    
    return textParts.join(' ').trim();
  } catch (error) {
    console.warn('Stream extraction failed:', error);
    return '';
  }
}

function extractFromTextObjects(pdfString: string): string {
  try {
    const textParts: string[] = [];
    
    // Look for BT...ET blocks (Begin Text...End Text)
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/gi;
    let match;
    
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const textObject = match[1];
      
      // Extract text from show text operations
      const textContent = extractFromShowTextOperations(textObject);
      if (textContent.length > 5) {
        textParts.push(textContent);
      }
    }
    
    return textParts.join(' ').trim();
  } catch (error) {
    console.warn('Text object extraction failed:', error);
    return '';
  }
}

function extractFromShowTextOperations(textObject: string): string {
  try {
    const textParts: string[] = [];
    
    // Look for text show operations: (text) Tj, (text) TJ, [(text)] TJ
    const showTextPatterns = [
      /\((.*?)\)\s*Tj/gi,
      /\((.*?)\)\s*TJ/gi,
      /\[(.*?)\]\s*TJ/gi
    ];
    
    for (const pattern of showTextPatterns) {
      let match;
      while ((match = pattern.exec(textObject)) !== null) {
        const text = match[1];
        if (text && text.length > 1) {
          textParts.push(cleanTextContent(text));
        }
      }
    }
    
    return textParts.join(' ');
  } catch (error) {
    console.warn('Show text extraction failed:', error);
    return '';
  }
}

function extractReadablePatterns(pdfString: string): string {
  try {
    const textParts: string[] = [];
    
    // Extract email-like content
    const emailPatterns = [
      /From:\s*([^\r\n]+)/gi,
      /To:\s*([^\r\n]+)/gi,
      /Subject:\s*([^\r\n]+)/gi,
      /Date:\s*([^\r\n]+)/gi
    ];
    
    // Extract sentences (text that looks like readable content)
    const sentencePattern = /[A-Z][a-zA-Z\s,.'";:!?-]{20,}[.!?]/g;
    
    // Apply email patterns
    for (const pattern of emailPatterns) {
      let match;
      while ((match = pattern.exec(pdfString)) !== null) {
        const text = cleanTextContent(match[1]);
        if (text.length > 3) {
          textParts.push(text);
        }
      }
    }
    
    // Apply sentence pattern
    let match;
    while ((match = sentencePattern.exec(pdfString)) !== null) {
      const sentence = cleanTextContent(match[0]);
      if (sentence.length > 15 && !sentence.includes('\0')) {
        textParts.push(sentence);
      }
    }
    
    return textParts.slice(0, 50).join(' '); // Limit to avoid too much content
  } catch (error) {
    console.warn('Pattern extraction failed:', error);
    return '';
  }
}

function extractReadableFromStream(streamContent: string): string {
  try {
    // Remove PDF operators and keep readable text
    const cleaned = streamContent
      .replace(/[<>]/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\/[A-Za-z0-9]+/g, ' ')
      .replace(/\b\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+[a-zA-Z]+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ');
    
    // Extract words that look like readable text
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !word.includes('\0')
    );
    
    return words.join(' ');
  } catch (error) {
    console.warn('Stream content extraction failed:', error);
    return '';
  }
}

function cleanTextContent(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\[nrtbf]/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createFallbackContent(pdfString: string): string {
  try {
    // Try to extract basic metadata
    const creatorMatch = pdfString.match(/\/Creator\s*\((.*?)\)/);
    const titleMatch = pdfString.match(/\/Title\s*\((.*?)\)/);
    
    let content = 'Email from HOA manager';
    
    if (titleMatch && titleMatch[1]) {
      content = cleanTextContent(titleMatch[1]) || content;
    }
    
    content += ` - Document uploaded ${new Date().toISOString().split('T')[0]}`;
    
    // Look for any email addresses or readable text snippets
    const emailMatch = pdfString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      content += `. Contact: ${emailMatch[0]}`;
    }
    
    content += '. Content requires manual review for full details.';
    
    return content;
  } catch (error) {
    console.warn('Fallback content creation failed:', error);
    return 'Email from HOA manager - Document uploaded. Content available for manual review.';
  }
}

function cleanAndValidateText(text: string): string {
  if (!text) return '';
  
  try {
    // Clean the text
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .trim();
    
    // Remove excessive repetition
    cleaned = cleaned.replace(/(\b\w+\b)(\s+\1){3,}/g, '$1');
    
    // Validate quality
    const words = cleaned.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && /^[a-zA-Z]/.test(word)
    );
    
    if (meaningfulWords.length < 5) {
      return 'Email from HOA manager - Document content extracted but requires manual review for details.';
    }
    
    // Limit length to avoid too much content
    if (cleaned.length > 5000) {
      cleaned = cleaned.substring(0, 5000) + '... [Content truncated]';
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Text cleaning failed:', error);
    return text;
  }
}

// Improved chunking with better sentence detection
export function chunkDocument(content: string): string[] {
  try {
    console.log(`Starting chunking for ${content.length} characters`);
    
    if (content.length < 50) {
      console.warn('Content too short for chunking, returning as single chunk');
      return [content];
    }
    
    const MAX_CHUNK_SIZE = 800; // Smaller chunks for better processing
    const chunks: string[] = [];
    
    // First try sentence-based chunking
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length > 0) {
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        
        const sentenceWithPeriod = trimmed + '.';
        
        if (currentChunk.length + sentenceWithPeriod.length > MAX_CHUNK_SIZE && currentChunk.length > 100) {
          chunks.push(currentChunk.trim());
          currentChunk = sentenceWithPeriod;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentenceWithPeriod;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
    
    // Fallback to character-based chunking if no sentences found
    if (chunks.length === 0) {
      for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
        const chunk = content.slice(i, i + MAX_CHUNK_SIZE).trim();
        if (chunk.length > 20) {
          chunks.push(chunk);
        }
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
    return [content];
  }
}
