
// Advanced PDF Processor - Main orchestrator with OpenAI Vision as primary method

import { extractTextWithLibrary, validateLibraryExtraction } from './pdfLibraryService.ts';
import { extractTextWithOpenAIVision } from './openaiVisionService.ts';
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
  console.log('=== STARTING ENHANCED PDF EXTRACTION WITH OPENAI VISION PRIMARY ===');
  console.log(`Processing PDF of ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // STEP 1: Try OpenAI Vision OCR FIRST for best quality
    console.log('=== STEP 1: OPENAI VISION OCR (PRIMARY METHOD) ===');
    const ocrResult = await extractTextWithOpenAIVision(pdfData);
    
    console.log(`OpenAI Vision OCR result:`);
    console.log(`- Text length: ${ocrResult.text.length}`);
    console.log(`- Confidence: ${ocrResult.confidence}`);
    console.log(`- Content preview: "${ocrResult.text.substring(0, 200)}..."`);
    
    // Enhanced validation for legal content
    const hasLegalContent = isLegalContent(ocrResult.text);
    const hasReadableText = ocrResult.text.length > 100 && ocrResult.confidence > 0.4;
    
    if (hasReadableText || hasLegalContent) {
      console.log('✅ OpenAI Vision OCR SUCCESSFUL - using primary extraction method');
      return {
        text: ocrResult.text,
        method: 'openai-vision-ocr-primary',
        quality: Math.max(ocrResult.confidence, hasLegalContent ? 0.8 : 0.6),
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount || 1,
        isScanned: false, // OCR can handle both scanned and text PDFs
        processingNotes: `Primary OCR extraction: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}`
      };
    }
    
    console.log('❌ OpenAI Vision OCR failed or low quality - trying native parsing fallback');
    
    // STEP 2: Try native Deno PDF text extraction as fallback
    console.log('=== STEP 2: NATIVE DENO PDF EXTRACTION (FALLBACK) ===');
    const libraryResult = await extractTextWithLibrary(pdfData);
    const libraryValidation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    console.log(`Native Deno extraction result:`);
    console.log(`- Text length: ${libraryResult.text.length}`);
    console.log(`- Page count: ${libraryResult.pageCount}`);
    console.log(`- Quality: ${libraryValidation.quality}`);
    console.log(`- Valid: ${libraryValidation.isValid}`);
    console.log(`- Content preview: "${libraryResult.text.substring(0, 200)}..."`);
    
    if (libraryValidation.isValid && libraryResult.text.length > 50) {
      console.log('✅ Native Deno extraction successful as fallback');
      return {
        text: libraryResult.text,
        method: 'native-deno-parsing-fallback',
        quality: libraryValidation.quality,
        confidence: 0.7,
        pageCount: libraryResult.pageCount,
        isScanned: false,
        processingNotes: `Fallback extraction: ${libraryResult.text.length} characters using native Deno parsing`
      };
    }
    
    console.log('❌ Both extraction methods failed - using comprehensive fallback');
    return createComprehensiveAnalysisFallback(pdfData);
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    return createComprehensiveAnalysisFallback(pdfData, error.message);
  }
}

// Enhanced legal content detection
function isLegalContent(text: string): boolean {
  if (!text || text.length < 20) return false;
  
  const legalTerms = [
    'REQUEST FOR PRODUCTION',
    'DISCOVERY',
    'INTERROGATORY',
    'DEFENDANT',
    'PLAINTIFF',
    'COURT',
    'CASE NO',
    'MOTION',
    'DTPA',
    'DEMAND LETTER',
    'ATTORNEY',
    'LAW FIRM',
    'PURSUANT TO',
    'TEXAS DECEPTIVE TRADE PRACTICES',
    'VIOLATION',
    'DAMAGES',
    'DEMAND',
    'SETTLEMENT'
  ];
  
  const upperText = text.toUpperCase();
  const foundTerms = legalTerms.filter(term => upperText.includes(term));
  
  if (foundTerms.length > 0) {
    console.log(`✅ Legal content detected: ${foundTerms.join(', ')}`);
    return true;
  }
  
  return false;
}

// Export the chunking function for backward compatibility
export { chunkDocumentAdvanced };
