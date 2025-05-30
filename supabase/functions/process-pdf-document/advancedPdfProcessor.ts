
// Advanced PDF Processor - Main orchestrator with native Deno approach

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
  console.log('=== STARTING NATIVE DENO PDF EXTRACTION ===');
  console.log(`Processing PDF of ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // STEP 1: Try native Deno PDF text extraction first
    console.log('=== STEP 1: NATIVE DENO PDF EXTRACTION ===');
    const libraryResult = await extractTextWithLibrary(pdfData);
    const libraryValidation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    console.log(`Native Deno extraction result:`);
    console.log(`- Text length: ${libraryResult.text.length}`);
    console.log(`- Page count: ${libraryResult.pageCount}`);
    console.log(`- Quality: ${libraryValidation.quality}`);
    console.log(`- Valid: ${libraryValidation.isValid}`);
    console.log(`- Content preview: "${libraryResult.text.substring(0, 200)}..."`);
    
    if (libraryValidation.isValid && libraryResult.text.length > 100) {
      console.log('✅ Native Deno extraction SUCCESSFUL - using extracted content');
      return {
        text: libraryResult.text,
        method: 'native-deno-parsing',
        quality: libraryValidation.quality,
        confidence: 0.9,
        pageCount: libraryResult.pageCount,
        isScanned: false,
        processingNotes: `Successfully extracted ${libraryResult.text.length} characters using native Deno PDF parsing`
      };
    }
    
    console.log('❌ Native Deno extraction failed or low quality - trying OpenAI Vision OCR');
    
    // STEP 2: OpenAI Vision OCR for scanned documents or failed native extraction
    console.log('=== STEP 2: OPENAI VISION OCR ===');
    const ocrResult = await extractTextWithOpenAIVision(pdfData);
    
    console.log(`OpenAI Vision OCR result:`);
    console.log(`- Text length: ${ocrResult.text.length}`);
    console.log(`- Confidence: ${ocrResult.confidence}`);
    console.log(`- Content preview: "${ocrResult.text.substring(0, 200)}..."`);
    
    if (ocrResult.text.length > 50 && ocrResult.confidence > 0.3) {
      console.log('✅ OpenAI Vision OCR SUCCESSFUL');
      return {
        text: ocrResult.text,
        method: 'openai-vision-ocr',
        quality: ocrResult.confidence,
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount || libraryResult.pageCount,
        isScanned: true,
        processingNotes: `OCR processed with OpenAI Vision (${ocrResult.text.length} chars, confidence: ${ocrResult.confidence})`
      };
    }
    
    console.log('❌ Both native Deno and OpenAI Vision OCR failed - using fallback analysis');
    return createComprehensiveAnalysisFallback(pdfData);
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    return createComprehensiveAnalysisFallback(pdfData, error.message);
  }
}

// Export the chunking function for backward compatibility
export { chunkDocumentAdvanced };
