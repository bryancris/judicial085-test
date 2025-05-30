
// Enhanced PDF Library Service - Using native Deno PDF parsing
export async function extractTextWithLibrary(pdfData: Uint8Array): Promise<{text: string, pageCount: number}> {
  console.log('📄 Starting native Deno PDF extraction...');
  
  try {
    console.log(`Processing PDF data: ${pdfData.length} bytes`);
    
    // Convert to string for pattern matching
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Extract text using multiple strategies
    const extractedText = extractTextFromPdfString(pdfString);
    const pageCount = estimatePageCount(pdfString);
    
    console.log(`Native extraction results:`);
    console.log(`- Text length: ${extractedText.length} characters`);
    console.log(`- Page count: ${pageCount}`);
    console.log(`- Text preview: "${extractedText.substring(0, 200)}..."`);
    
    if (extractedText.length > 50) {
      console.log('✅ Native PDF extraction successful');
      return {
        text: extractedText,
        pageCount: pageCount
      };
    } else {
      console.log('❌ Native extraction produced minimal text');
      return {
        text: extractedText,
        pageCount: pageCount
      };
    }
    
  } catch (error) {
    console.error('❌ Native PDF extraction failed:', error);
    throw new Error(`Native PDF parsing failed: ${error.message}`);
  }
}

// Extract text from PDF string using multiple patterns
function extractTextFromPdfString(pdfString: string): string {
  const textSegments: string[] = [];
  
  try {
    // Pattern 1: Direct text extraction from text objects
    const textPattern = /\(([^)]{3,})\)\s*Tj/gi;
    let match;
    while ((match = textPattern.exec(pdfString)) !== null) {
      const text = match[1];
      if (isValidTextContent(text)) {
        textSegments.push(cleanText(text));
      }
    }
    
    // Pattern 2: Text within BT/ET blocks (Begin Text/End Text)
    const btEtPattern = /BT\s*([\s\S]*?)\s*ET/gi;
    let btMatch;
    while ((btMatch = btEtPattern.exec(pdfString)) !== null) {
      const textBlock = btMatch[1];
      const innerTextPattern = /\(([^)]{3,})\)/g;
      let innerMatch;
      while ((innerMatch = innerTextPattern.exec(textBlock)) !== null) {
        const text = innerMatch[1];
        if (isValidTextContent(text)) {
          textSegments.push(cleanText(text));
        }
      }
    }
    
    // Pattern 3: Stream content extraction
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
    let streamMatch;
    while ((streamMatch = streamPattern.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1];
      // Look for readable text in streams
      const readableText = extractReadableFromStream(streamContent);
      if (readableText) {
        textSegments.push(readableText);
      }
    }
    
    // Combine and clean all text segments
    const combinedText = textSegments.join(' ').trim();
    return cleanExtractedText(combinedText);
    
  } catch (error) {
    console.warn('Error in text extraction patterns:', error);
    return '';
  }
}

// Extract readable text from stream content
function extractReadableFromStream(streamContent: string): string {
  try {
    // Look for text patterns in decoded streams
    const textMatches = streamContent.match(/[A-Za-z][A-Za-z0-9\s.,;:!?()-]{10,}/g);
    if (textMatches) {
      return textMatches
        .filter(text => isValidTextContent(text))
        .map(text => cleanText(text))
        .join(' ');
    }
    return '';
  } catch {
    return '';
  }
}

// Check if text content is valid (not metadata or garbage)
function isValidTextContent(text: string): boolean {
  if (!text || text.length < 3) return false;
  
  // Check for legal document terms (high priority)
  const legalTerms = ['REQUEST', 'DISCOVERY', 'COURT', 'CASE', 'DEFENDANT', 'PLAINTIFF', 'ATTORNEY'];
  if (legalTerms.some(term => text.toUpperCase().includes(term))) {
    return true;
  }
  
  // Reject obvious metadata patterns
  const metadataPatterns = [
    /^PDF\s+/i,
    /^[A-Z]{2,4}(\s+[A-Z]{2,4}){3,}/,
    /rdf:|xml:|dc:/i,
    /Producer|Creator|ModDate/i,
    /^[^\w\s]*[A-Za-z]{1,4}\^/,
    /begin=|end=/
  ];
  
  if (metadataPatterns.some(pattern => pattern.test(text))) {
    return false;
  }
  
  // Check for reasonable character distribution
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalCount = text.length;
  const alphaRatio = alphaCount / totalCount;
  
  return alphaRatio > 0.3; // At least 30% alphabetic characters
}

// Clean extracted text
function cleanText(text: string): string {
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean the final extracted text
function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Add proper line breaks after sentences
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    // Clean up any weird characters
    .replace(/[^\x20-\x7E\s\n]/g, ' ')
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

// Validate library extraction quality
export function validateLibraryExtraction(text: string, pageCount: number): {isValid: boolean, quality: number, issues: string[]} {
  const issues: string[] = [];
  let quality = 1.0;
  
  // Check text length
  if (text.length < 100) {
    issues.push('Extracted text is very short');
    quality -= 0.3;
  }
  
  // Check for meaningful content
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word)
  );
  
  const meaningfulRatio = words.length > 0 ? meaningfulWords.length / words.length : 0;
  
  if (meaningfulRatio < 0.4) {
    issues.push('Low ratio of meaningful words');
    quality -= 0.2;
  }
  
  // Check for legal document indicators
  const legalTerms = ['discovery', 'request', 'court', 'case', 'legal', 'motion', 'brief', 'demand', 'dtpa', 'attorney'];
  const hasLegalTerms = legalTerms.some(term => 
    text.toLowerCase().includes(term)
  );
  
  if (hasLegalTerms) {
    quality += 0.1; // Bonus for legal content
    console.log('✅ Legal document content detected');
  }
  
  const isValid = quality > 0.3 && text.length > 50;
  
  console.log(`Validation results: isValid=${isValid}, quality=${quality}, issues=${issues.length}`);
  
  return {
    isValid,
    quality: Math.max(0, Math.min(1, quality)),
    issues
  };
}
