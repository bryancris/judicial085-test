
/**
 * ====================================================================
 * PDF-PARSE EXTRACTION SERVICE - STANDARD PDF TEXT EXTRACTION
 * ====================================================================
 * 
 * This service handles standard PDF text extraction using the pdf-parse library.
 * It's the first step in our 3-tier processing strategy and works best with
 * digitally-created PDFs that have embedded text content.
 * 
 * WHEN USED:
 * - First attempt for all PDF documents
 * - Best for digitally-created PDFs (Word docs saved as PDF, etc.)
 * - Works with most modern legal documents
 * - Fast processing (typically 2-5 seconds)
 * 
 * HOW IT WORKS:
 * - Directly reads embedded text from PDF structure
 * - No OCR required - extracts existing text objects
 * - Preserves basic formatting and structure
 * - Calculates quality metrics for extracted text
 * 
 * LIMITATIONS:
 * - Cannot process scanned documents or images
 * - May fail with complex layouts or corrupted files
 * - Limited success with password-protected files
 * - Quality varies with PDF creation method
 */

import pdfParse from 'npm:pdf-parse@1.1.1';

export interface PdfParseResult {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}

/**
 * EXTRACT TEXT USING PDF-PARSE LIBRARY
 * 
 * Performs direct text extraction from PDF files using the pdf-parse library.
 * This is the fastest and most reliable method for digitally-created PDFs.
 * 
 * EXTRACTION PROCESS:
 * 1. Load PDF document structure
 * 2. Extract embedded text objects
 * 3. Calculate quality and confidence metrics
 * 4. Return structured result with metadata
 * 
 * QUALITY ASSESSMENT:
 * - Analyzes alphanumeric content ratio
 * - Evaluates word count and average length
 * - Calculates confidence based on text characteristics
 * - Rejects documents with insufficient content (<20 chars)
 * 
 * @param pdfData - Raw PDF file bytes
 * @returns PdfParseResult with text, quality metrics, and metadata
 */
export async function extractTextWithPdfParse(pdfData: Uint8Array): Promise<PdfParseResult> {
  console.log('📄 Starting pdf-parse text extraction (standard PDF processing)...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    console.log('🔍 Loading PDF document structure with pdf-parse...');
    
    // Extract text directly from PDF structure
    const pdfResult = await pdfParse(pdfData);
    
    console.log(`✅ pdf-parse extraction completed:`);
    console.log(`  - Text length: ${pdfResult.text.length} characters`);
    console.log(`  - Page count: ${pdfResult.numpages}`);
    
    // Reject documents with insufficient content
    if (pdfResult.text.length < 20) {
      throw new Error('pdf-parse extracted insufficient text content');
    }
    
    // Calculate quality and confidence metrics
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

/**
 * VALIDATE PDF-PARSE EXTRACTION RESULTS
 * 
 * Performs lenient validation of extracted text, designed to accept
 * borderline cases that might be valid legal documents.
 * 
 * VALIDATION CRITERIA (LENIENT):
 * - Must have at least 5 characters of content
 * - Must have valid page count (≥1)
 * - Must have reasonable ratio of readable characters
 * - Accepts most text that contains recognizable content
 * 
 * NOTE: This validation is more permissive than OCR validation
 * because pdf-parse typically produces higher quality results.
 * 
 * @param text - Extracted text content
 * @param pageCount - Number of pages detected
 * @returns Validation result with any issues found
 */
export function validatePdfParseExtraction(text: string, pageCount: number): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for minimal content requirement
  if (text.length < 5) {
    issues.push('No meaningful text extracted');
  }
  
  // Validate page count
  if (pageCount < 1) {
    issues.push('Invalid page count');
  }
  
  // Check for readable content (very lenient threshold)
  const readableRatio = (text.match(/[a-zA-Z0-9\s.,;:!?()'-]/g) || []).length / text.length;
  if (readableRatio < 0.1) {
    issues.push('Text appears to be corrupted binary data');
  }
  
  // Accept any text that passes basic readability
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}

/**
 * CALCULATE TEXT QUALITY SCORE FOR PDF-PARSE EXTRACTION
 * 
 * Analyzes extracted text to determine quality on a scale from 0.1 to 1.0.
 * Used to decide whether to accept pdf-parse results or fall back to OCR.
 * 
 * QUALITY METRICS:
 * - Alphanumeric ratio (40% weight): Letters/numbers vs symbols/punctuation
 * - Word count (30% weight): More words generally indicate better extraction
 * - Average word length (30% weight): Reasonable word lengths suggest accuracy
 * 
 * SCORING:
 * - 0.8+: Excellent quality, definitely use
 * - 0.5-0.8: Good quality, likely acceptable
 * - 0.3-0.5: Marginal quality, may trigger OCR fallback
 * - <0.3: Poor quality, will likely trigger OCR fallback
 * 
 * @param text - Extracted text to analyze
 * @returns Quality score between 0.1 (poor) and 1.0 (excellent)
 */
function calculateTextQuality(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Calculate text characteristics
  const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / wordCount;
  
  // Normalize each metric to 0-1 scale
  const alphanumericScore = Math.min(1, alphanumericRatio / 0.8);
  const wordCountScore = Math.min(1, wordCount / 100);
  const wordLengthScore = Math.min(1, avgWordLength / 6);
  
  // Weighted composite score
  const quality = (alphanumericScore * 0.4) + (wordCountScore * 0.3) + (wordLengthScore * 0.3);
  
  return Math.max(0.1, Math.min(1, quality));
}
