
// Comprehensive PDF text extraction with multiple fallback strategies
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting comprehensive PDF text extraction...');
    
    // Strategy 1: Direct text extraction from PDF structure
    let extractedText = '';
    
    try {
      console.log('Attempting direct PDF structure extraction...');
      extractedText = extractTextFromPdfStructure(pdfData);
      
      if (extractedText && extractedText.length > 50) {
        const cleanedText = cleanAndValidateContent(extractedText);
        if (cleanedText && cleanedText.length > 50) {
          console.log(`Direct extraction successful: ${cleanedText.length} characters`);
          return cleanedText;
        }
      }
    } catch (structureError) {
      console.warn('Direct structure extraction failed:', structureError);
    }
    
    // Strategy 2: Text pattern matching
    try {
      console.log('Attempting text pattern matching...');
      extractedText = extractTextWithPatterns(pdfData);
      
      if (extractedText && extractedText.length > 50) {
        const cleanedText = cleanAndValidateContent(extractedText);
        if (cleanedText && cleanedText.length > 50) {
          console.log(`Pattern matching successful: ${cleanedText.length} characters`);
          return cleanedText;
        }
      }
    } catch (patternError) {
      console.warn('Pattern matching failed:', patternError);
    }
    
    // Strategy 3: Raw text extraction
    try {
      console.log('Attempting raw text extraction...');
      extractedText = extractRawText(pdfData);
      
      if (extractedText && extractedText.length > 50) {
        const cleanedText = cleanAndValidateContent(extractedText);
        if (cleanedText && cleanedText.length > 50) {
          console.log(`Raw extraction successful: ${cleanedText.length} characters`);
          return cleanedText;
        }
      }
    } catch (rawError) {
      console.warn('Raw extraction failed:', rawError);
    }
    
    throw new Error('All text extraction strategies failed to produce readable content');
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract readable text from PDF: ${error.message}`);
  }
}

// Extract text from PDF internal structure
function extractTextFromPdfStructure(pdfData: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfString = decoder.decode(pdfData);
  
  const textContent: string[] = [];
  
  // Look for text objects in PDF streams
  const streamPattern = /stream\s*(.*?)\s*endstream/gs;
  const streams = pdfString.match(streamPattern) || [];
  
  for (const stream of streams) {
    // Extract text from text objects (BT...ET blocks)
    const textObjectPattern = /BT\s*(.*?)\s*ET/gs;
    const textObjects = stream.match(textObjectPattern) || [];
    
    for (const textObj of textObjects) {
      // Extract strings in parentheses or angle brackets
      const stringPatterns = [
        /\(((?:[^()\\]|\\.)*)\)/g,  // (text)
        /<([^<>]*)>/g               // <text>
      ];
      
      for (const pattern of stringPatterns) {
        const matches = textObj.match(pattern) || [];
        for (const match of matches) {
          let text = match.slice(1, -1); // Remove brackets
          text = text.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
          
          if (text.length > 3 && /[a-zA-Z]/.test(text)) {
            textContent.push(text);
          }
        }
      }
    }
  }
  
  return textContent.join(' ').trim();
}

// Extract text using comprehensive pattern matching
function extractTextWithPatterns(pdfData: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfString = decoder.decode(pdfData);
  
  const extractedParts: string[] = [];
  
  // Email-specific patterns
  const emailPatterns = [
    // Subject lines
    /(?:subject|subj):\s*([^\r\n]+)/gi,
    // From/To lines
    /(?:from|to|cc|bcc):\s*([^\r\n]+)/gi,
    // Email content (sentences)
    /([A-Z][^.!?]*[.!?])/g,
    // Quoted text
    />\s*([^>\r\n]+)/g,
    // Date/time patterns
    /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+\w+\s+\d{1,2},?\s+\d{4}/gi,
    /\b\d{1,2}:\d{2}\s*(?:am|pm)\b/gi
  ];
  
  // Text content patterns
  const contentPatterns = [
    // Complete sentences
    /[A-Z][^.!?]{10,}[.!?]/g,
    // Paragraphs
    /[A-Z][^.!?]*[.!?](?:\s+[A-Z][^.!?]*[.!?]){1,}/g,
    // Lines with meaningful text
    /^[A-Za-z][^\r\n]{20,}$/gm
  ];
  
  // Apply email patterns first
  for (const pattern of emailPatterns) {
    const matches = pdfString.match(pattern) || [];
    for (const match of matches) {
      const cleaned = match.replace(/^(subject|from|to|cc|bcc):\s*/gi, '').trim();
      if (cleaned.length > 5) {
        extractedParts.push(cleaned);
      }
    }
  }
  
  // Apply content patterns
  for (const pattern of contentPatterns) {
    const matches = pdfString.match(pattern) || [];
    for (const match of matches) {
      if (match.length > 10 && /[a-zA-Z]/.test(match)) {
        extractedParts.push(match.trim());
      }
    }
  }
  
  return extractedParts.join(' ').trim();
}

// Extract raw text with basic filtering
function extractRawText(pdfData: Uint8Array): string {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let text = decoder.decode(pdfData);
  
  // Remove PDF structural elements
  text = text.replace(/\bobj\b|\bendobj\b|\bstream\b|\bendstream\b/g, ' ');
  text = text.replace(/\/[A-Za-z]+\b/g, ' '); // Remove PDF commands
  text = text.replace(/\b\d{1,3}\s+\d{1,3}\s+\d{1,3}\s+RG\b/g, ' '); // Remove color commands
  text = text.replace(/\b[A-F0-9]{32,}\b/g, ' '); // Remove hex strings
  
  // Extract readable text lines
  const lines = text.split(/[\r\n]+/);
  const readableLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if line contains readable text
    if (trimmed.length > 10 && 
        /[a-zA-Z]/.test(trimmed) && 
        trimmed.split(/\s+/).length > 2) {
      
      // Filter out lines that are mostly symbols or numbers
      const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
      const totalCount = trimmed.length;
      
      if (alphaCount / totalCount > 0.3) {
        readableLines.push(trimmed);
      }
    }
  }
  
  return readableLines.join(' ').trim();
}

// Comprehensive content cleaning and validation
function cleanAndValidateContent(rawText: string): string {
  if (!rawText || rawText.length < 10) return '';
  
  console.log('Cleaning and validating extracted content...');
  
  // Basic cleanup
  let cleanText = rawText
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
  
  // Remove repetitive email patterns
  cleanText = cleanText.replace(/(\b[\w.-]+@[\w.-]+\.\w+\b)\s*(\1\s*){2,}/g, '$1 ');
  
  // Remove excessive repetition
  cleanText = cleanText.replace(/(\b\w+\b)(\s+\1){3,}/g, '$1');
  
  // Split into sentences and filter
  const sentences = cleanText.split(/[.!?]+/).filter(sentence => {
    const trimmed = sentence.trim();
    
    if (trimmed.length < 15) return false;
    
    // Check for meaningful content ratio
    const words = trimmed.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) && 
      !/@/.test(word) // Not just email addresses
    );
    
    return meaningfulWords.length >= Math.min(3, words.length * 0.3);
  });
  
  const result = sentences.join('. ').trim();
  
  // Final validation
  if (result.length < 50) {
    console.warn('Content too short after cleaning');
    return '';
  }
  
  // Check for readable content ratio
  const alphaCount = (result.match(/[a-zA-Z]/g) || []).length;
  const readabilityRatio = alphaCount / result.length;
  
  if (readabilityRatio < 0.5) {
    console.warn(`Content readability too low: ${readabilityRatio}`);
    return '';
  }
  
  console.log(`Content cleaning completed: ${rawText.length} -> ${result.length} characters`);
  return result;
}

// Improved chunking with validation
export function chunkDocument(content: string): string[] {
  const MAX_CHUNK_CHARS = 1500;
  const OVERLAP_CHARS = 150;
  const MIN_CHUNK_CHARS = 100;
  
  console.log(`Starting chunking for ${content.length} characters`);
  
  if (content.length < MIN_CHUNK_CHARS) {
    throw new Error('Content too short for chunking');
  }
  
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = content.split(/\n\s*\n|\r\n\s*\r\n/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length === 0) {
    // Fallback to sentence-based chunking
    return chunkBySentences(content, MAX_CHUNK_CHARS, MIN_CHUNK_CHARS);
  }
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    
    if (trimmed.length > MAX_CHUNK_CHARS) {
      // Handle oversized paragraphs
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      chunks.push(...splitLargeParagraph(trimmed, MAX_CHUNK_CHARS, OVERLAP_CHARS));
      continue;
    }
    
    const potential = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
    
    if (potential.length > MAX_CHUNK_CHARS && currentChunk.length >= MIN_CHUNK_CHARS) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk = potential;
    }
  }
  
  if (currentChunk.trim() && currentChunk.length >= MIN_CHUNK_CHARS) {
    chunks.push(currentChunk.trim());
  }
  
  const validChunks = chunks.filter(chunk => chunk.length >= MIN_CHUNK_CHARS);
  
  if (validChunks.length === 0) {
    throw new Error('No valid chunks could be created');
  }
  
  console.log(`Chunking completed: ${validChunks.length} valid chunks created`);
  return validChunks;
}

function chunkBySentences(content: string, maxChars: number, minChars: number): string[] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim() + '.';
    const potential = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
    
    if (potential.length > maxChars && currentChunk.length >= minChars) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk = potential;
    }
  }
  
  if (currentChunk.trim() && currentChunk.length >= minChars) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

function splitLargeParagraph(paragraph: string, maxChars: number, overlapChars: number): string[] {
  const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim() + '.';
    const potential = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
    
    if (potential.length > maxChars && currentChunk.length > 100) {
      chunks.push(currentChunk.trim());
      
      // Add overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlapChars / 6));
      currentChunk = overlapWords.join(' ') + ' ' + trimmed;
    } else {
      currentChunk = potential;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
