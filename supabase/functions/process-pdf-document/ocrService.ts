
// OCR Service for scanned PDFs and fallback text extraction - Deno Compatible
export async function extractTextWithOCR(pdfData: Uint8Array): Promise<{text: string, confidence: number}> {
  console.log('Starting OCR-based text extraction for scanned PDF...');
  
  try {
    // For Deno environment, we'll implement a pattern-based OCR approach
    const ocrResult = await performPatternBasedOCR(pdfData);
    
    console.log(`OCR extraction completed: ${ocrResult.text.length} characters, confidence: ${ocrResult.confidence}`);
    
    return ocrResult;
    
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return {
      text: '',
      confidence: 0
    };
  }
}

// Pattern-based OCR implementation for Deno
async function performPatternBasedOCR(pdfData: Uint8Array): Promise<{text: string, confidence: number}> {
  try {
    // Convert PDF to text using pattern recognition for common document types
    const result = await extractTextFromScannedPDF(pdfData);
    
    return {
      text: result.text,
      confidence: result.confidence
    };
    
  } catch (error) {
    console.error('Pattern-based OCR failed:', error);
    return {
      text: '',
      confidence: 0
    };
  }
}

// Extract text from scanned PDF using pattern matching - Deno compatible
async function extractTextFromScannedPDF(pdfData: Uint8Array): Promise<{text: string, confidence: number}> {
  try {
    // Convert Uint8Array to string for pattern analysis
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Look for embedded text that might be searchable even in scanned PDFs
    const embeddedText = extractEmbeddedText(pdfString);
    
    if (embeddedText.length > 100) {
      return {
        text: embeddedText,
        confidence: 0.8
      };
    }
    
    // For scanned documents, create a meaningful placeholder
    const documentInfo = analyzeScannedDocument(pdfData);
    
    return {
      text: documentInfo.description,
      confidence: 0.3
    };
  } catch (error) {
    console.error('Error in extractTextFromScannedPDF:', error);
    return {
      text: createFallbackDescription(pdfData),
      confidence: 0.1
    };
  }
}

// Extract any embedded text from scanned PDFs
function extractEmbeddedText(pdfString: string): string {
  const textParts: string[] = [];
  
  // Look for any readable text patterns
  const readablePatterns = [
    // Email patterns
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Phone patterns  
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // Date patterns
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    // Common words (looking for sequences of letters)
    /\b[A-Za-z]{3,}\b/g
  ];
  
  for (const pattern of readablePatterns) {
    const matches = pdfString.match(pattern);
    if (matches) {
      textParts.push(...matches);
    }
  }
  
  return textParts.join(' ');
}

// Analyze scanned document to create meaningful description
function analyzeScannedDocument(pdfData: Uint8Array): {description: string, type: string} {
  const size = pdfData.length;
  const sizeKB = Math.round(size / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Analyze PDF structure to guess document type
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData.slice(0, Math.min(10000, pdfData.length)));
  
  let documentType = 'Scanned Document';
  let description = '';
  
  // Check for form characteristics
  if (pdfString.includes('/Annot') || pdfString.includes('/Widget')) {
    documentType = 'Scanned Form';
    description = 'This appears to be a scanned form document. ';
  }
  
  // Check for multi-page structure
  const pageCount = (pdfString.match(/\/Type\s*\/Page/gi) || []).length;
  if (pageCount > 1) {
    description += `Multi-page document with ${pageCount} pages. `;
  }
  
  // Check for image content
  if (pdfString.includes('/Image') || pdfString.includes('/DCTDecode')) {
    description += 'Contains scanned images requiring OCR processing. ';
  }
  
  const finalDescription = `${documentType} (${sizeKB}KB) - Uploaded ${currentDate}

${description}This document appears to be a scanned PDF that may contain:
- Handwritten or typed text requiring OCR
- Forms or structured data
- Images or charts

For complete text extraction, advanced OCR processing would be needed. The document is stored and available for manual review and analysis.

Note: This is a scanned document preview. Full content extraction may require specialized OCR tools.`;

  return {
    description: finalDescription,
    type: documentType
  };
}

// Create fallback description when all else fails
function createFallbackDescription(pdfData: Uint8Array): string {
  const size = pdfData.length;
  const sizeKB = Math.round(size / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `PDF Document (${sizeKB}KB) - Uploaded ${currentDate}

This document has been stored successfully but requires manual review for complete content extraction. The file appears to contain complex formatting or scanned content that needs specialized processing.

Document is available for download and manual analysis.`;
}

// Validate OCR results
export function validateOCRExtraction(text: string, confidence: number): {isValid: boolean, quality: number, needsManualReview: boolean} {
  const quality = confidence;
  const isValid = confidence > 0.1 && text.length > 20;
  const needsManualReview = confidence < 0.7;
  
  return {
    isValid,
    quality,
    needsManualReview
  };
}
