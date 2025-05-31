
// Fallback PDF extraction service without external dependencies

export async function extractTextWithPdfrex(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('📄 Starting fallback PDF text extraction...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Use built-in PDF text extraction
    const extractedText = await extractTextFromPdfBytes(pdfData);
    
    console.log(`✅ Extraction completed: ${extractedText.length} characters`);
    
    if (extractedText.length < 20) {
      throw new Error('Extraction produced insufficient content');
    }
    
    // Calculate quality metrics
    const quality = calculateExtractionQuality(extractedText);
    const confidence = Math.min(0.90, quality + 0.15);
    const pageCount = estimatePageCount(pdfData);
    
    return {
      text: extractedText.trim(),
      method: 'fallback-text-extraction',
      quality: quality,
      confidence: confidence,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

// Extract text from PDF bytes using built-in methods
async function extractTextFromPdfBytes(pdfData: Uint8Array): Promise<string> {
  const textParts: string[] = [];
  
  try {
    // Convert to string for pattern matching
    const pdfString = new TextDecoder('latin1').decode(pdfData);
    
    // Extract text content using multiple strategies
    const strategies = [
      () => extractFromTextObjects(pdfString),
      () => extractFromStreamObjects(pdfString),
      () => extractFromStringLiterals(pdfString),
      () => extractReadableContent(pdfString)
    ];
    
    for (const strategy of strategies) {
      try {
        const result = strategy();
        if (result && result.length > 50) {
          textParts.push(result);
          break; // Use the first successful extraction
        }
      } catch (e) {
        console.warn('Strategy failed, trying next:', e.message);
        continue;
      }
    }
    
    if (textParts.length === 0) {
      // Final fallback: extract any readable ASCII text
      const readableText = extractAnyReadableText(pdfString);
      if (readableText.length > 20) {
        textParts.push(readableText);
      }
    }
    
    const finalText = textParts.join(' ').trim();
    
    if (finalText.length < 20) {
      throw new Error('Could not extract sufficient text content from PDF');
    }
    
    return finalText;
    
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

// Extract text from PDF text objects
function extractFromTextObjects(pdfString: string): string {
  const textParts: string[] = [];
  
  // Look for BT...ET blocks (text objects)
  const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/gi;
  let match;
  
  while ((match = textObjectRegex.exec(pdfString)) !== null) {
    const textObject = match[1];
    const extractedText = parseTextOperations(textObject);
    if (extractedText && extractedText.length > 3) {
      textParts.push(extractedText);
    }
  }
  
  return textParts.join(' ').trim();
}

// Extract text from stream objects
function extractFromStreamObjects(pdfString: string): string {
  const textParts: string[] = [];
  
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
  let match;
  
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const streamContent = match[1];
    
    // Skip binary streams
    if (streamContent.includes('\0') || streamContent.includes('%PDF')) {
      continue;
    }
    
    const readableText = extractReadableFromStream(streamContent);
    if (readableText && readableText.length > 10) {
      textParts.push(readableText);
    }
  }
  
  return textParts.join(' ').trim();
}

// Extract text from string literals
function extractFromStringLiterals(pdfString: string): string {
  const textParts: string[] = [];
  
  // Look for string literals in parentheses
  const stringRegex = /\(([^)]{3,})\)/g;
  let match;
  
  while ((match = stringRegex.exec(pdfString)) !== null) {
    const text = cleanPdfText(match[1]);
    if (text && text.length > 3 && isReadableText(text)) {
      textParts.push(text);
    }
  }
  
  return textParts.join(' ').trim();
}

// Extract any readable content
function extractReadableContent(pdfString: string): string {
  // Look for readable ASCII text patterns
  const readableRegex = /[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{10,}/g;
  const matches = pdfString.match(readableRegex) || [];
  
  const meaningfulText = matches
    .filter(text => isReadableText(text))
    .filter(text => !text.includes('obj') && !text.includes('endobj'))
    .join(' ');
  
  return meaningfulText.trim();
}

// Extract any readable ASCII text as final fallback
function extractAnyReadableText(pdfString: string): string {
  // Extract sequences of printable ASCII characters
  const asciiRegex = /[\x20-\x7E]{5,}/g;
  const matches = pdfString.match(asciiRegex) || [];
  
  const readableMatches = matches
    .filter(text => {
      const words = text.split(/\s+/).filter(w => w.length > 2);
      return words.length > 2 && isReadableText(text);
    })
    .slice(0, 20); // Limit to prevent too much noise
  
  return readableMatches.join(' ').trim();
}

// Parse PDF text operations
function parseTextOperations(textObject: string): string {
  const textParts: string[] = [];
  
  // Text show operations
  const showPatterns = [
    /\((.*?)\)\s*Tj/gi,
    /\((.*?)\)\s*TJ/gi,
    /\[(.*?)\]\s*TJ/gi,
    /"(.*?)"\s*Tj/gi
  ];
  
  for (const pattern of showPatterns) {
    let match;
    while ((match = pattern.exec(textObject)) !== null) {
      const text = cleanPdfText(match[1]);
      if (text && text.length > 1) {
        textParts.push(text);
      }
    }
  }
  
  return textParts.join(' ');
}

// Extract readable content from PDF streams
function extractReadableFromStream(streamContent: string): string {
  try {
    // Clean up PDF operators and control characters
    let cleaned = streamContent
      .replace(/[<>]/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\/[A-Za-z0-9]+/g, ' ')
      .replace(/\b\d+\.?\d*\s+\d+\.?\d*\s+[a-zA-Z]+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Extract meaningful words
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      isReadableText(word)
    );
    
    return words.join(' ').trim();
  } catch (error) {
    return '';
  }
}

// Clean PDF text content
function cleanPdfText(text: string): string {
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

// Check if text is readable/meaningful
function isReadableText(text: string): boolean {
  if (!text || text.length < 3) return false;
  
  // Check for reasonable character distribution
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const total = text.length;
  const letterRatio = letters / total;
  
  // Should be mostly letters and common punctuation
  return letterRatio > 0.6 && 
         !text.includes('>>') && 
         !text.includes('<<') &&
         !/^[0-9\s.]+$/.test(text);
}

// Calculate extraction quality
function calculateExtractionQuality(text: string): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.7; // Base quality for successful extraction
  
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const sentences = text.match(/[.!?]+/g) || [];
  
  // Quality factors
  if (words.length > 50) quality += 0.1;
  if (sentences.length > 3) quality += 0.1;
  if (text.length > 500) quality += 0.1;
  
  // Check for legal document indicators
  const legalTerms = [
    'ATTORNEY', 'LAW', 'COURT', 'CASE', 'LEGAL', 'PLAINTIFF', 'DEFENDANT',
    'PURSUANT', 'VIOLATION', 'DAMAGES', 'DTPA', 'DEMAND', 'NOTICE'
  ];
  
  const upperText = text.toUpperCase();
  const legalTermsFound = legalTerms.filter(term => upperText.includes(term));
  
  if (legalTermsFound.length > 0) {
    quality += 0.1;
    console.log(`✅ Legal document indicators found: ${legalTermsFound.join(', ')}`);
  }
  
  return Math.max(0.1, Math.min(0.95, quality));
}

// Estimate page count from PDF size
function estimatePageCount(pdfData: Uint8Array): number {
  const sizeKB = pdfData.length / 1024;
  
  // Rough estimation: 50-100KB per page for typical legal documents
  const estimatedPages = Math.max(1, Math.ceil(sizeKB / 75));
  
  return Math.min(estimatedPages, 50); // Cap at 50 pages for safety
}

// Validate extraction results
export function validatePdfrexExtraction(text: string, pageCount: number): {
  isValid: boolean;
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  const quality = calculateExtractionQuality(text);
  
  if (text.length < 20) {
    issues.push('Extracted text is too short');
  }
  
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  if (words.length < 10) {
    issues.push('Too few meaningful words extracted');
  }
  
  const isValid = quality > 0.3 && text.length > 20 && issues.length < 2;
  
  console.log(`Extraction validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality,
    issues
  };
}
