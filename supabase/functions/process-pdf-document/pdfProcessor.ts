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
        
        // Validate the extracted text quality
        if (isValidExtractedText(extractedText)) {
          const cleanedText = cleanAndValidateText(extractedText);
          if (cleanedText && cleanedText.length > 50) {
            console.log(`Successfully extracted ${cleanedText.length} characters of readable text`);
            return cleanedText;
          }
        }
      }
    } catch (parseError) {
      console.warn('pdf-parse failed:', parseError);
    }
    
    // Strategy 2: Try alternative pdf2pic approach
    try {
      console.log('Attempting alternative PDF text extraction...');
      
      // Use pdf-lib for basic structure reading
      const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@1.17.1');
      const pdfDoc = await PDFDocument.load(pdfData);
      const pages = pdfDoc.getPages();
      
      console.log(`PDF loaded with ${pages.length} pages`);
      
      // Try to extract text objects from PDF structure
      const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(pdfData);
      extractedText = extractTextFromPdfStructure(pdfString);
      
      if (extractedText && isValidExtractedText(extractedText)) {
        const cleanedText = cleanAndValidateText(extractedText);
        if (cleanedText && cleanedText.length > 50) {
          console.log(`Alternative method extracted ${cleanedText.length} characters`);
          return cleanedText;
        }
      }
    } catch (structureError) {
      console.warn('Structure-based extraction failed:', structureError);
    }
    
    // Strategy 3: Manual text pattern extraction as last resort
    console.log('Attempting manual pattern extraction...');
    const manualText = extractTextManually(pdfData);
    
    if (manualText && isValidExtractedText(manualText)) {
      const cleanedText = cleanAndValidateText(manualText);
      if (cleanedText && cleanedText.length > 50) {
        console.log(`Manual extraction yielded ${cleanedText.length} characters`);
        return cleanedText;
      }
    }
    
    // If all strategies fail
    throw new Error('Unable to extract readable text from PDF. The document may be image-based, corrupted, or contain no extractable text content.');
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

// Validate if extracted text is actual readable content vs technical metadata
function isValidExtractedText(text: string): boolean {
  if (!text || text.length < 20) return false;
  
  // Check for readable content indicators
  const alphaChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.length;
  const alphaRatio = alphaChars / totalChars;
  
  // Must be at least 40% alphabetic characters
  if (alphaRatio < 0.4) {
    console.log(`Text failed alpha ratio test: ${alphaRatio}`);
    return false;
  }
  
  // Check for common technical garbage patterns
  const garbagePatterns = [
    /node\d{8,}/gi,           // Node references
    /^[^a-zA-Z\s]{20,}/,      // Long strings without letters
    /^\s*[0-9\W]{50,}/,       // Mostly numbers and symbols
    /^[A-F0-9\s]{100,}$/i,    // Hex-like patterns
    /mozilla.*gecko/gi,       // Browser strings
    /%PDF-/gi,                // PDF headers
    /stream.*endstream/gi,    // PDF stream objects
  ];
  
  for (const pattern of garbagePatterns) {
    if (pattern.test(text)) {
      console.log(`Text failed garbage pattern test: ${pattern}`);
      return false;
    }
  }
  
  // Check for readable words
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word) && 
    word.length < 50
  );
  
  const readableWordRatio = words.length / text.split(/\s+/).length;
  if (readableWordRatio < 0.3) {
    console.log(`Text failed readable word ratio test: ${readableWordRatio}`);
    return false;
  }
  
  console.log(`Text validation passed: ${alphaRatio} alpha ratio, ${readableWordRatio} readable word ratio`);
  return true;
}

// Extract text from PDF internal structure
function extractTextFromPdfStructure(pdfString: string): string {
  let extractedText = '';
  
  // Look for text content in PDF streams
  const textObjectPattern = /BT\s*(.*?)\s*ET/gs;
  const textMatches = pdfString.match(textObjectPattern);
  
  if (textMatches) {
    for (const match of textMatches) {
      // Extract text from between parentheses or brackets
      const textContent = match.match(/\((.*?)\)/g) || match.match(/\[(.*?)\]/g);
      if (textContent) {
        for (const content of textContent) {
          const cleaned = content.slice(1, -1) // Remove brackets/parentheses
            .replace(/\\[rn]/g, ' ') // Replace escaped newlines
            .replace(/\\\(/g, '(')   // Unescape parentheses
            .replace(/\\\)/g, ')')
            .trim();
          
          if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned)) {
            extractedText += cleaned + ' ';
          }
        }
      }
    }
  }
  
  return extractedText.trim();
}

// Manual extraction for difficult PDFs
function extractTextManually(pdfData: Uint8Array): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const pdfString = decoder.decode(pdfData);
    
    // Look for common email/document patterns
    const patterns = [
      /(?:from|to|subject|date):\s*([^\r\n]+)/gi,
      /[A-Z][a-z]+\s+[A-Z][a-z]+/g, // Names
      /\b[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/g, // Word sequences
      /\b\w+@\w+\.\w+\b/g, // Email addresses
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Dates
    ];
    
    let extractedText = '';
    
    for (const pattern of patterns) {
      const matches = pdfString.match(pattern);
      if (matches) {
        extractedText += matches.join(' ') + ' ';
      }
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('Manual extraction failed:', error);
    return '';
  }
}

// Clean and validate extracted text
function cleanAndValidateText(rawText: string): string {
  if (!rawText) return '';
  
  console.log('Cleaning and validating extracted text...');
  
  // Basic cleaning
  let cleanText = rawText
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove control characters but keep basic punctuation
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove excessive punctuation
    .replace(/[.,;:!?]{3,}/g, '. ')
    .trim();
  
  // Split into sentences and filter out junk
  const sentences = cleanText.split(/[.!?]+/).filter(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length < 10) return false;
    
    // Check if sentence has reasonable word composition
    const words = trimmed.split(/\s+/);
    const validWords = words.filter(word => 
      word.length > 1 && 
      word.length < 30 && 
      /^[a-zA-Z0-9@.-]+$/.test(word)
    );
    
    return validWords.length >= Math.min(3, words.length * 0.6);
  });
  
  cleanText = sentences.join('. ').trim();
  
  // Final validation
  if (cleanText.length < 50) {
    console.warn('Cleaned text too short after filtering');
    return '';
  }
  
  console.log(`Text cleaning completed: ${rawText.length} -> ${cleanText.length} characters`);
  return cleanText;
}

// Enhanced chunking with better content preservation
export function chunkDocument(content: string): string[] {
  const MAX_CHUNK_CHARS = 2000; // ~500 tokens
  const OVERLAP_CHARS = 200;    // ~50 tokens overlap
  const MIN_CHUNK_CHARS = 100;  // Minimum viable chunk size
  
  console.log(`Starting enhanced chunking for ${content.length} characters`);
  
  // Validate and clean content first
  if (!isValidExtractedText(content)) {
    throw new Error('Content failed validation - appears to be technical metadata rather than readable text');
  }
  
  const cleanContent = cleanAndValidateText(content);
  if (!cleanContent) {
    throw new Error('No valid content remaining after cleaning');
  }
  
  const chunks: string[] = [];
  
  // Try paragraph-based chunking first
  const paragraphs = cleanContent.split(/\n\s*\n|\. {2,}/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length === 0) {
    // Fallback to sentence-based chunking
    return sentenceBasedChunking(cleanContent, MAX_CHUNK_CHARS, OVERLAP_CHARS);
  }
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    // If paragraph is too large, split it
    if (trimmedParagraph.length > MAX_CHUNK_CHARS) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      chunks.push(...splitLargeParagraph(trimmedParagraph, MAX_CHUNK_CHARS, OVERLAP_CHARS));
      continue;
    }
    
    // Check if adding this paragraph would exceed the limit
    const potentialChunk = currentChunk ? currentChunk + '\n\n' + trimmedParagraph : trimmedParagraph;
    
    if (potentialChunk.length > MAX_CHUNK_CHARS && currentChunk.length > MIN_CHUNK_CHARS) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedParagraph;
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
    if (!isValidExtractedText(chunk)) {
      console.warn('Filtering out invalid chunk');
      return false;
    }
    const tokenCount = estimateTokenCount(chunk);
    if (tokenCount > 600) {
      console.warn(`Chunk too large (${tokenCount} tokens), filtering out`);
      return false;
    }
    return true;
  });
  
  if (validatedChunks.length === 0) {
    throw new Error('No valid chunks could be created from the content');
  }
  
  console.log(`Enhanced chunking completed: ${validatedChunks.length} valid chunks created`);
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

// Split large paragraphs while preserving meaning
function splitLargeParagraph(paragraph: string, maxChars: number, overlapChars: number): string[] {
  const chunks: string[] = [];
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 5);
  
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
