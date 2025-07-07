
// PDF text extraction using pdf-parse - Deno compatible, no workers required

import pdfParse from 'npm:pdf-parse@1.1.1';

export interface PdfParseResult {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}

export async function extractTextWithPdfParse(pdfData: Uint8Array): Promise<PdfParseResult> {
  console.log('📄 Starting pdf-parse text extraction (Deno-compatible)...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    console.log('🔍 Loading PDF document with pdf-parse...');
    
    // Parse PDF using pdf-parse
    const pdfResult = await pdfParse(pdfData);
    
    console.log(`✅ pdf-parse extraction completed:`);
    console.log(`  - Text length: ${pdfResult.text.length} characters`);
    console.log(`  - Page count: ${pdfResult.numpages}`);
    
    if (pdfResult.text.length < 20) {
      throw new Error('pdf-parse extracted insufficient text content');
    }
    
    // Calculate quality metrics
    const quality = calculateTextQuality(pdfResult.text);
    const confidence = Math.min(0.95, quality + 0.15); // pdf-parse is generally reliable
    
    console.log(`  - Text quality: ${quality.toFixed(3)}`);
    console.log(`  - Confidence: ${confidence.toFixed(3)}`);
    
    return {
      text: pdfResult.text.trim(),
      method: 'pdf-parse-extraction',
      quality: quality,
      confidence: confidence,
      pageCount: pdfResult.numpages || 1
    };
    
  } catch (error) {
    console.error('❌ pdf-parse extraction failed:', error);
    throw new Error(`pdf-parse extraction failed: ${error.message}`);
  }
}

// Much more lenient validation for pdf-parse extraction results
export function validatePdfParseExtraction(text: string, pageCount: number): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Only fail for truly problematic cases
  if (text.length < 5) {
    issues.push('No meaningful text extracted');
  }
  
  // Check for completely invalid page count
  if (pageCount < 1) {
    issues.push('Invalid page count');
  }
  
  // Only reject if text is mostly non-readable characters
  const readableRatio = (text.match(/[a-zA-Z0-9\s.,;:!?()'-]/g) || []).length / text.length;
  if (readableRatio < 0.1) {
    issues.push('Text appears to be corrupted binary data');
  }
  
  // Accept any text that has basic readability
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

// Calculate text quality score
function calculateTextQuality(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Calculate various quality metrics
  const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / wordCount;
  
  // Normalize metrics
  const alphanumericScore = Math.min(1, alphanumericRatio / 0.8);
  const wordCountScore = Math.min(1, wordCount / 100);
  const wordLengthScore = Math.min(1, avgWordLength / 6);
  
  // Calculate composite quality score
  const quality = (alphanumericScore * 0.4) + (wordCountScore * 0.3) + (wordLengthScore * 0.3);
  
  return Math.max(0.1, Math.min(1, quality));
}
