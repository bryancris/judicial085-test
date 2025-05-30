
// Advanced PDF Processor - Main orchestrator

import { extractTextFromPdfReal } from './core/pdfExtractionCore.ts';
import { extractTextWithWorkingOCR, validateOCRResult } from './workingOcrService.ts';
import { validateExtraction } from './utils/validationUtils.ts';
import { chunkDocumentAdvanced } from './utils/chunkingUtils.ts';
import { createComprehensiveAnalysisFallback } from './utils/fallbackAnalysisUtils.ts';

export async function extractTextFromPdfAdvanced(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
}> {
  console.log('=== STARTING ENHANCED MULTI-STRATEGY PDF EXTRACTION ===');
  console.log(`Processing PDF of ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Strategy 1: Enhanced real PDF text extraction
    console.log('=== STRATEGY 1: ENHANCED REAL PDF EXTRACTION ===');
    const pdfResult = await extractTextFromPdfReal(pdfData);
    
    console.log(`Enhanced real extraction result:`);
    console.log(`- Method: ${pdfResult.method}`);
    console.log(`- Text length: ${pdfResult.text.length}`);
    console.log(`- Quality: ${pdfResult.quality}`);
    console.log(`- Confidence: ${pdfResult.confidence}`);
    console.log(`- Content preview: "${pdfResult.text.substring(0, 300)}..."`);
    
    // ENHANCED validation with lower thresholds for real content
    const isValidExtraction = validateExtraction(pdfResult);
    
    if (isValidExtraction && pdfResult.quality > 0.1 && pdfResult.text.length > 30) {
      console.log('✅ Enhanced real PDF extraction SUCCESSFUL - using extracted content');
      return {
        text: pdfResult.text,
        method: pdfResult.method,
        quality: pdfResult.quality,
        confidence: pdfResult.confidence,
        pageCount: pdfResult.pageCount,
        isScanned: false,
        processingNotes: `Successfully extracted ${pdfResult.text.length} characters using enhanced ${pdfResult.method}`
      };
    }
    
    console.log('❌ Enhanced real PDF extraction failed validation - trying OCR strategy');
    
    // Strategy 2: Working OCR for scanned documents
    console.log('=== STRATEGY 2: WORKING OCR EXTRACTION ===');
    const ocrResult = await extractTextWithWorkingOCR(pdfData);
    const ocrValidation = validateOCRResult(ocrResult.text, ocrResult.confidence);
    
    console.log(`OCR result: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}, valid: ${ocrValidation.isValid}`);
    
    if (ocrValidation.isValid && ocrResult.text.length > 50) {
      console.log('✅ OCR extraction SUCCESSFUL');
      return {
        text: ocrResult.text,
        method: 'enhanced-working-ocr',
        quality: ocrValidation.quality,
        confidence: ocrResult.confidence,
        pageCount: 1,
        isScanned: true,
        processingNotes: `OCR processed document (${ocrResult.text.length} chars)`
      };
    }
    
    console.log('❌ Both enhanced extraction methods failed - using comprehensive analysis');
    return createComprehensiveAnalysisFallback(pdfData);
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    return createComprehensiveAnalysisFallback(pdfData, error.message);
  }
}

// Export the chunking function for backward compatibility
export { chunkDocumentAdvanced };
