
// Enhanced PDF Library Service - Improved native Deno PDF parsing with better text extraction

export async function extractTextWithLibrary(pdfData: Uint8Array): Promise<{text: string, pageCount: number}> {
  console.log('📄 Starting enhanced native Deno PDF extraction...');
  
  try {
    console.log(`Processing PDF data: ${pdfData.length} bytes`);
    
    // Convert to string for pattern matching
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Enhanced text extraction using multiple strategies
    const extractedText = extractTextFromPdfStringEnhanced(pdfString);
    const pageCount = estimatePageCount(pdfString);
    
    console.log(`Enhanced native extraction results:`);
    console.log(`- Text length: ${extractedText.length} characters`);
    console.log(`- Page count: ${pageCount}`);
    console.log(`- Text preview: "${extractedText.substring(0, 300)}..."`);
    
    return {
      text: extractedText,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ Enhanced native PDF extraction failed:', error);
    throw new Error(`Enhanced native PDF parsing failed: ${error.message}`);
  }
}

// Enhanced text extraction with better patterns and cleaning
function extractTextFromPdfStringEnhanced(pdfString: string): string {
  const textSegments: string[] = [];
  
  try {
    // Strategy 1: Enhanced text object extraction with better patterns
    const textPatterns = [
      // Standard text show operators
      /\(([^)]{5,})\)\s*Tj/gi,
      // Text with positioning
      /\[\(([^)]{5,})\)\]\s*TJ/gi,
      // Direct string literals in content streams
      /\(([A-Za-z][^)]{10,})\)/g,
      // Text in brackets with positioning
      /\[\(([^)]{3,})\)\s*[-\d\s]*\]/g
    ];
    
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(pdfString)) !== null) {
        const text = match[1];
        if (isValidEnhancedTextContent(text)) {
          textSegments.push(cleanTextEnhanced(text));
        }
      }
    }
    
    // Strategy 2: Extract from text blocks (BT/ET pairs)
    const btEtPattern = /BT\s*([\s\S]*?)\s*ET/gi;
    let btMatch;
    while ((btMatch = btEtPattern.exec(pdfString)) !== null) {
      const textBlock = btMatch[1];
      
      // Look for text within this block
      const innerTextPattern = /\(([^)]{3,})\)/g;
      let innerMatch;
      while ((innerMatch = innerTextPattern.exec(textBlock)) !== null) {
        const text = innerMatch[1];
        if (isValidEnhancedTextContent(text)) {
          textSegments.push(cleanTextEnhanced(text));
        }
      }
    }
    
    // Strategy 3: Look for decoded text in streams
    extractFromStreams(pdfString, textSegments);
    
    // Strategy 4: Extract any readable ASCII text sequences
    extractReadableSequences(pdfString, textSegments);
    
    // Combine, clean, and structure all text segments
    const combinedText = textSegments.join(' ').trim();
    return structureExtractedText(combinedText);
    
  } catch (error) {
    console.warn('Error in enhanced text extraction patterns:', error);
    return '';
  }
}

// Enhanced validation for text content
function isValidEnhancedTextContent(text: string): boolean {
  if (!text || text.length < 2) return false;
  
  // Priority check for legal terms (always include)
  const legalTerms = [
    'DTPA', 'DEMAND', 'ATTORNEY', 'LAW', 'COURT', 'CASE', 'REQUEST', 'DISCOVERY',
    'PLAINTIFF', 'DEFENDANT', 'PURSUANT', 'VIOLATION', 'DAMAGES', 'TEXAS'
  ];
  
  const upperText = text.toUpperCase();
  if (legalTerms.some(term => upperText.includes(term))) {
    console.log(`✅ Legal term detected: "${text}"`);
    return true;
  }
  
  // Check for email addresses (law firm contact info)
  if (/@/.test(text) && text.includes('.')) {
    return true;
  }
  
  // Reject obvious metadata patterns
  const metadataPatterns = [
    /^PDF\s+/i,
    /^[A-Z]{2,4}(\s+[A-Z]{2,4}){5,}/,
    /rdf:|xml:|dc:/i,
    /Producer|Creator|ModDate/i,
    /^[^\w\s]*[A-Za-z]{1,4}\^/,
    /begin=|end=/,
    /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64-like
    /^[0-9A-Fa-f]{20,}$/ // Hex-like
  ];
  
  if (metadataPatterns.some(pattern => pattern.test(text))) {
    return false;
  }
  
  // Check for reasonable text characteristics
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalCount = text.length;
  const alphaRatio = alphaCount / totalCount;
  
  // Must have reasonable alphabetic content
  return alphaRatio > 0.4 && text.length >= 3;
}

// Enhanced text cleaning
function cleanTextEnhanced(text: string): string {
  return text
    // Handle PDF escape sequences
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    // Clean weird characters but preserve legal text
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text from stream content
function extractFromStreams(pdfString: string, textSegments: string[]): void {
  const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
  let streamMatch;
  
  while ((streamMatch = streamPattern.exec(pdfString)) !== null) {
    const streamContent = streamMatch[1];
    
    // Look for readable text in streams (not compressed)
    const readablePattern = /[A-Za-z][A-Za-z0-9\s.,;:!?()'-]{15,}/g;
    const readableMatches = streamContent.match(readablePattern);
    
    if (readableMatches) {
      readableMatches.forEach(match => {
        if (isValidEnhancedTextContent(match)) {
          textSegments.push(cleanTextEnhanced(match));
        }
      });
    }
  }
}

// Extract readable ASCII sequences that might be content
function extractReadableSequences(pdfString: string, textSegments: string[]): void {
  // Look for sequences of readable characters that might be document content
  const readableSequencePattern = /[A-Za-z][A-Za-z0-9\s.,;:!?()'-]{20,}/g;
  const sequences = pdfString.match(readableSequencePattern) || [];
  
  sequences.forEach(sequence => {
    if (isValidEnhancedTextContent(sequence)) {
      // Further filter for likely content vs metadata
      if (!sequence.includes('obj') && !sequence.includes('endobj') && 
          !sequence.includes('xref') && !sequence.includes('trailer')) {
        textSegments.push(cleanTextEnhanced(sequence));
      }
    }
  });
}

// Structure the extracted text for better readability
function structureExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Try to restore sentence structure
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    // Clean up remaining artifacts
    .replace(/[^\x20-\x7E\s\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

// Estimate page count from PDF structure
function estimatePageCount(pdfString: string): number {
  try {
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/gi);
    return pageMatches ? Math.max(1, pageMatches.length) : 1;
  } catch {
    return 1;
  }
}

// Enhanced validation for library extraction quality
export function validateLibraryExtraction(text: string, pageCount: number): {isValid: boolean, quality: number, issues: string[]} {
  const issues: string[] = [];
  let quality = 1.0;
  
  // Check text length
  if (text.length < 50) {
    issues.push('Extracted text is very short');
    quality -= 0.4;
  } else if (text.length < 200) {
    issues.push('Extracted text is short');
    quality -= 0.2;
  }
  
  // Check for meaningful content
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word) &&
    !word.match(/^[A-Z]{2,4}$/) // Skip abbreviations
  );
  
  const meaningfulRatio = words.length > 0 ? meaningfulWords.length / words.length : 0;
  
  if (meaningfulRatio < 0.3) {
    issues.push('Low ratio of meaningful words');
    quality -= 0.3;
  }
  
  // Boost quality for legal document indicators
  const legalTerms = [
    'dtpa', 'demand', 'attorney', 'law', 'court', 'case', 'legal', 'motion', 
    'brief', 'request', 'discovery', 'violation', 'damages', 'plaintiff', 'defendant'
  ];
  const hasLegalTerms = legalTerms.some(term => 
    text.toLowerCase().includes(term)
  );
  
  if (hasLegalTerms) {
    quality += 0.2; // Significant boost for legal content
    console.log('✅ Enhanced validation: Legal document content detected');
  }
  
  // Check for email addresses (law firm info)
  if (/@/.test(text)) {
    quality += 0.1;
    console.log('✅ Contact information detected');
  }
  
  const isValid = quality > 0.2 && text.length > 30;
  
  console.log(`Enhanced validation results: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality: Math.max(0, Math.min(1, quality)),
    issues
  };
}
