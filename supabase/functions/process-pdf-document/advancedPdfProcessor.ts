
// Advanced PDF Processor - OpenAI Vision primary with enhanced fallback

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
    console.log(`- Content preview: "${ocrResult.text.substring(0, 300)}..."`);
    
    // Enhanced validation for legal content - be more lenient for OpenAI Vision
    const hasLegalContent = isLegalContent(ocrResult.text);
    const hasReadableText = ocrResult.text.length > 50 && ocrResult.confidence > 0.3;
    const hasBasicStructure = ocrResult.text.includes(' ') && ocrResult.text.match(/[a-zA-Z]{3,}/g);
    
    if (hasReadableText || hasLegalContent || hasBasicStructure) {
      console.log('✅ OpenAI Vision OCR SUCCESSFUL - using primary extraction method');
      return {
        text: ocrResult.text,
        method: 'openai-vision-ocr-primary',
        quality: Math.max(ocrResult.confidence, hasLegalContent ? 0.9 : 0.7),
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount || 1,
        isScanned: true, // Vision API handles both but assume scanned for this case
        processingNotes: `Primary Vision OCR: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}`
      };
    }
    
    console.log('❌ OpenAI Vision OCR insufficient quality - trying native parsing fallback');
    
    // STEP 2: Try native parsing as fallback only if Vision fails
    console.log('=== STEP 2: NATIVE PARSING FALLBACK ===');
    const libraryResult = await extractTextWithLibrary(pdfData);
    const libraryValidation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    console.log(`Native parsing result:`);
    console.log(`- Text length: ${libraryResult.text.length}`);
    console.log(`- Quality: ${libraryValidation.quality}`);
    console.log(`- Valid: ${libraryValidation.isValid}`);
    console.log(`- Content preview: "${libraryResult.text.substring(0, 200)}..."`);
    
    // Use native result if it's better than Vision result
    if (libraryValidation.isValid && libraryResult.text.length > ocrResult.text.length) {
      console.log('✅ Native parsing better than Vision - using native result');
      return {
        text: libraryResult.text,
        method: 'native-parsing-better-fallback',
        quality: libraryValidation.quality,
        confidence: 0.6,
        pageCount: libraryResult.pageCount,
        isScanned: false,
        processingNotes: `Native parsing better: ${libraryResult.text.length} chars vs Vision ${ocrResult.text.length} chars`
      };
    }
    
    // If we have any result from Vision, use it even if low quality
    if (ocrResult.text.length > 20) {
      console.log('⚠️ Using low-quality Vision result as best available');
      return {
        text: ocrResult.text,
        method: 'openai-vision-low-quality',
        quality: Math.max(0.4, ocrResult.confidence),
        confidence: ocrResult.confidence,
        pageCount: ocrResult.pageCount || 1,
        isScanned: true,
        processingNotes: `Low-quality Vision result: ${ocrResult.text.length} chars (fallback used)`
      };
    }
    
    console.log('❌ All extraction methods failed - using comprehensive fallback');
    return createComprehensiveAnalysisFallback(pdfData);
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    return createComprehensiveAnalysisFallback(pdfData, error.message);
  }
}

// Enhanced legal content detection with more patterns
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
    'SETTLEMENT',
    'LEGAL NOTICE',
    'STATUTORY',
    'CEASE AND DESIST'
  ];
  
  const upperText = text.toUpperCase();
  const foundTerms = legalTerms.filter(term => upperText.includes(term));
  
  if (foundTerms.length > 0) {
    console.log(`✅ Legal content detected: ${foundTerms.join(', ')}`);
    return true;
  }
  
  // Also check for common legal document patterns
  const legalPatterns = [
    /\b\d{4}-\d{4,6}\b/, // Case numbers
    /\b[A-Z]{2,}\s+[A-Z]{2,}\s+[A-Z]{2,}\b/, // All caps legal headers
    /Dear\s+[A-Z]/i, // Formal letter greeting
    /Re:\s+/i, // Subject line
    /Sincerely,/i, // Letter closing
    /Attorney\s+for/i // Attorney representation
  ];
  
  const hasLegalPattern = legalPatterns.some(pattern => pattern.test(text));
  if (hasLegalPattern) {
    console.log('✅ Legal document pattern detected');
    return true;
  }
  
  return false;
}

// Export the chunking function for backward compatibility
export { chunkDocumentAdvanced };
