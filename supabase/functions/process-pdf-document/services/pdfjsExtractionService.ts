
// PDF-parse-based extraction service (replacing PDF.js completely)

export async function extractTextWithPdfJs(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('📄 Starting pdf-parse text extraction...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Import pdf-parse for PDF text extraction
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
    
    console.log('🔍 Extracting text with pdf-parse...');
    
    // Extract text from PDF buffer
    const pdfBuffer = pdfData.buffer.slice(pdfData.byteOffset, pdfData.byteOffset + pdfData.byteLength);
    const result = await pdfParse.default(pdfBuffer);
    
    const extractedText = result.text?.trim() || '';
    const pageCount = result.numpages || 1;
    
    console.log(`✅ pdf-parse extraction completed: ${extractedText.length} characters from ${pageCount} pages`);
    
    if (extractedText.length < 20) {
      throw new Error('pdf-parse extraction produced insufficient content');
    }
    
    // Calculate quality metrics
    const quality = calculatePdfParseQuality(extractedText, pageCount);
    const confidence = Math.min(0.90, quality + 0.1); // Good confidence for pdf-parse
    
    return {
      text: extractedText,
      method: 'pdf-parse-extraction',
      quality: quality,
      confidence: confidence,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ pdf-parse extraction failed:', error);
    throw new Error(`pdf-parse extraction failed: ${error.message}`);
  }
}

// Calculate extraction quality for pdf-parse results
function calculatePdfParseQuality(text: string, pageCount: number): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.75; // Good base quality for pdf-parse
  
  // Check text structure and content
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const sentences = text.match(/[.!?]+/g) || [];
  const paragraphs = text.split('\n').filter(p => p.trim().length > 10);
  
  // Quality boosts for well-structured content
  if (words.length > 50) quality += 0.05;
  if (sentences.length > 3) quality += 0.05;
  if (paragraphs.length > 2) quality += 0.05;
  
  // Check for legal document indicators
  const legalTerms = [
    'ATTORNEY', 'LAW', 'COURT', 'CASE', 'LEGAL', 'PLAINTIFF', 'DEFENDANT',
    'PURSUANT', 'VIOLATION', 'DAMAGES', 'DTPA', 'DEMAND', 'NOTICE'
  ];
  
  const upperText = text.toUpperCase();
  const legalTermsFound = legalTerms.filter(term => upperText.includes(term));
  
  if (legalTermsFound.length > 0) {
    quality += 0.1; // Significant boost for legal content
    console.log(`✅ Legal document indicators found: ${legalTermsFound.join(', ')}`);
  }
  
  // Page count factor
  if (pageCount > 1) {
    quality += Math.min(pageCount * 0.02, 0.1);
  }
  
  return Math.max(0.1, Math.min(0.95, quality));
}

// Validate pdf-parse extraction results
export function validatePdfJsExtraction(text: string, pageCount: number): {
  isValid: boolean;
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  const quality = calculatePdfParseQuality(text, pageCount);
  
  if (text.length < 20) {
    issues.push('Extracted text is too short');
  }
  
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  if (words.length < 10) {
    issues.push('Too few meaningful words extracted');
  }
  
  // Check for garbled text patterns
  const garbageRatio = (text.match(/[^\w\s.,!?;:()\-"']/g) || []).length / text.length;
  if (garbageRatio > 0.1) {
    issues.push('High ratio of special characters detected');
  }
  
  const isValid = quality > 0.3 && text.length > 20 && issues.length < 2;
  
  console.log(`pdf-parse validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality,
    issues
  };
}
