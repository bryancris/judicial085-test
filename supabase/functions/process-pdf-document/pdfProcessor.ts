
// Enhanced PDF text extraction using multiple strategies
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting enhanced PDF text extraction...');
    
    // Strategy 1: Try pdf-parse library for proper text extraction
    let extractedText = '';
    
    try {
      // Import pdf-parse library designed for text extraction
      const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
      
      console.log('Attempting pdf-parse extraction...');
      const data = await pdfParse.default(pdfData);
      
      if (data.text && data.text.trim()) {
        extractedText = data.text.trim();
        console.log(`pdf-parse extracted ${extractedText.length} characters from ${data.numpages} pages`);
        
        // Clean and validate the extracted text
        const cleanedText = cleanEmailContent(extractedText);
        if (cleanedText && cleanedText.length > 100) {
          console.log(`Successfully extracted ${cleanedText.length} characters of cleaned email content`);
          return cleanedText;
        }
      }
    } catch (parseError) {
      console.warn('pdf-parse failed:', parseError);
    }
    
    // Strategy 2: Try alternative pdf-lib approach for email PDFs
    try {
      console.log('Attempting pdf-lib extraction for email content...');
      
      const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      
      console.log(`PDF loaded with ${pages.length} pages`);
      
      // Try to extract text objects from PDF structure with email focus
      const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(pdfData);
      extractedText = extractEmailContentFromPdf(pdfString);
      
      if (extractedText && extractedText.length > 100) {
        const cleanedText = cleanEmailContent(extractedText);
        if (cleanedText && cleanedText.length > 100) {
          console.log(`Email extraction method yielded ${cleanedText.length} characters`);
          return cleanedText;
        }
      }
    } catch (structureError) {
      console.warn('PDF-lib extraction failed:', structureError);
    }
    
    // Strategy 3: Manual text pattern extraction focused on email content
    console.log('Attempting manual email pattern extraction...');
    const manualText = extractEmailPatterns(pdfData);
    
    if (manualText && manualText.length > 100) {
      const cleanedText = cleanEmailContent(manualText);
      if (cleanedText && cleanedText.length > 100) {
        console.log(`Manual email extraction yielded ${cleanedText.length} characters`);
        return cleanedText;
      }
    }
    
    // If all strategies fail
    throw new Error('Unable to extract meaningful email content from PDF. The document may be image-based, corrupted, or contain no readable text content.');
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Clean email content and remove repetitive fragments
function cleanEmailContent(rawText: string): string {
  if (!rawText) return '';
  
  console.log('Cleaning email content...');
  
  // Remove repeated email addresses and fragments
  let cleanText = rawText
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove repeated email address patterns
    .replace(/(\b[\w.-]+@[\w.-]+\.\w+\b)\s*(\1\s*){2,}/g, '$1 ')
    // Remove excessive punctuation
    .replace(/[.,;:!?]{3,}/g, '. ')
    // Remove repeated phrases
    .replace(/(\b\w+\b)\s*(\1\s*){3,}/g, '$1 ')
    .trim();
  
  // Extract meaningful email components
  const emailParts = extractMeaningfulEmailParts(cleanText);
  if (emailParts.length > 0) {
    cleanText = emailParts.join('\n\n');
  }
  
  // Split into sentences and filter out repetitive/garbage content
  const sentences = cleanText.split(/[.!?]+/).filter(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length < 20) return false;
    
    // Check for repetitive email addresses
    const emailMatches = (trimmed.match(/[\w.-]+@[\w.-]+\.\w+/g) || []);
    if (emailMatches.length > 3) return false;
    
    // Check for meaningful content
    const words = trimmed.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !/^[\w.-]+@[\w.-]+\.\w+$/.test(word) && // Not just an email
      word.length < 30 &&
      /^[a-zA-Z]/.test(word)
    );
    
    return meaningfulWords.length >= Math.min(5, words.length * 0.4);
  });
  
  cleanText = sentences.join('. ').trim();
  
  // Final validation
  if (cleanText.length < 100) {
    console.warn('Cleaned email content too short after filtering');
    return '';
  }
  
  console.log(`Email content cleaning completed: ${rawText.length} -> ${cleanText.length} characters`);
  return cleanText;
}

// Extract meaningful email parts (subject, body, etc.)
function extractMeaningfulEmailParts(text: string): string[] {
  const parts: string[] = [];
  
  // Look for email headers and content
  const patterns = [
    // Subject line
    /(?:subject|re|fwd?):\s*([^\r\n]+)/gi,
    // From/To lines with context
    /(?:from|to):\s*([^\r\n]+)/gi,
    // Email body content (sentences with actual words)
    /([A-Z][^.!?]*[.!?])/g,
    // Quoted text or replies
    />\s*([^>\r\n]+)/g
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.replace(/^(subject|from|to|re|fwd?):\s*/gi, '').trim();
        if (cleaned.length > 10 && !parts.includes(cleaned)) {
          parts.push(cleaned);
        }
      }
    }
  }
  
  return parts;
}

// Extract email content from PDF structure
function extractEmailContentFromPdf(pdfString: string): string {
  let extractedText = '';
  
  // Look for text content in PDF streams with email focus
  const textObjectPattern = /BT\s*(.*?)\s*ET/gs;
  const textMatches = pdfString.match(textObjectPattern);
  
  if (textMatches) {
    for (const match of textMatches) {
      // Extract text from between parentheses or brackets
      const textContent = match.match(/\((.*?)\)/g) || match.match(/\[(.*?)\]/g);
      if (textContent) {
        for (const content of textContent) {
          let cleaned = content.slice(1, -1) // Remove brackets/parentheses
            .replace(/\\[rn]/g, ' ') // Replace escaped newlines
            .replace(/\\\(/g, '(')   // Unescape parentheses
            .replace(/\\\)/g, ')')
            .trim();
          
          // Only include if it looks like meaningful email content
          if (cleaned.length > 5 && 
              /[a-zA-Z]/.test(cleaned) && 
              !cleaned.match(/^[\d\s<>@.]+$/) &&
              !cleaned.match(/^[A-F0-9\s]+$/i)) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }
  }
  
  return extractedText.trim();
}

// Manual extraction for email PDFs
function extractEmailPatterns(pdfData: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfString = decoder.decode(pdfData);
    
    // Look for email-specific patterns
    const patterns = [
      // Email headers
      /(?:subject|from|to|date|cc|bcc):\s*([^\r\n]+)/gi,
      // Email content lines
      /^[A-Z][a-z\s]+[.!?]$/gm,
      // Quoted text
      />\s*([A-Z][^\r\n<>]+)/g,
      // Email addresses with context
      /(\w+[\w\s,.-]*)\s+([\w.-]+@[\w.-]+\.\w+)/g,
      // Date patterns
      /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d{1,2},?\s+\d{4}/g,
      // Time patterns
      /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi
    ];
    
    let extractedText = '';
    
    for (const pattern of patterns) {
      const matches = pdfString.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean and validate each match
          const cleaned = match.replace(/[<>]/g, '').trim();
          if (cleaned.length > 5 && /[a-zA-Z]/.test(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Manual email extraction failed:', error);
    return '';
  }
}

// Enhanced chunking with better content preservation for emails
export function chunkDocument(content: string): string[] {
  const MAX_CHUNK_CHARS = 2000; // ~500 tokens
  const OVERLAP_CHARS = 200;    // ~50 tokens overlap
  const MIN_CHUNK_CHARS = 100;  // Minimum viable chunk size
  
  console.log(`Starting enhanced chunking for ${content.length} characters`);
  
  // Validate content first
  const cleanContent = cleanEmailContent(content);
  if (!cleanContent || cleanContent.length < MIN_CHUNK_CHARS) {
    throw new Error('No valid email content remaining after cleaning');
  }
  
  const chunks: string[] = [];
  
  // Try email-based chunking (by headers, paragraphs, etc.)
  const emailParts = cleanContent.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim().length > 20);
  
  if (emailParts.length === 0) {
    // Fallback to sentence-based chunking
    return sentenceBasedChunking(cleanContent, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  }
  
  let currentChunk = '';
  
  for (const part of emailParts) {
    const trimmedPart = part.trim();
    
    // If part is too large, split it
    if (trimmedPart.length > MAX_CHUNK_CHARS) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      chunks.push(...splitLargePart(trimmedPart, MAX_CHUNK_CHARS, OVERLAP_CHARS));
      continue;
    }
    
    // Check if adding this part would exceed the limit
    const potentialChunk = currentChunk ? currentChunk + '\n\n' + trimmedPart : trimmedPart;
    
    if (potentialChunk.length > MAX_CHUNK_CHARS && currentChunk.length > MIN_CHUNK_CHARS) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedPart;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim() && currentChunk.length >= MIN_CHUNK_CHARS) {
    chunks.push(currentChunk.trim());
  }
  
  // Validate all chunks
  const validatedChunks = chunks.filter(chunk => {
    const tokenCount = estimateTokenCount(chunk);
    if (tokenCount > 600) {
      console.warn(`Chunk too large (${tokenCount} tokens), filtering out`);
      return false;
    }
    return chunk.length >= MIN_CHUNK_CHARS;
  });
  
  if (validatedChunks.length === 0) {
    throw new Error('No valid chunks could be created from the email content');
  }
  
  console.log(`Enhanced email chunking completed: ${validatedChunks.length} valid chunks created`);
  return validatedChunks;
}

// Sentence-based chunking fallback
function sentenceBasedChunking(content: string, maxChars: number, overlapChars: number): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim() + '.';
    const potentialChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
    
    if (potentialChunk.length > maxChars && currentChunk.length > 100) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Split large parts while preserving meaning
function splitLargePart(part: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  const sentences = part.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim() + '.';
    const potentialChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
    
    if (potentialChunk.length > maxChars && currentChunk.length > 100) {
      chunks.push(currentChunk.trim());
      // Start new chunk with overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlapChars / 6)); // Approximate word overlap
      currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
    } else {
      currentChunk = potentialChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
