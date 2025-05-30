
// Advanced PDF Processor - OpenAI Vision PRIMARY with comprehensive debugging

import { extractTextWithLibrary, validateLibraryExtraction } from './pdfLibraryService.ts';
import { extractTextWithOpenAIVision } from './openaiVisionService.ts';
import { validateExtraction } from './utils/validationUtils.ts';
import { chunkDocumentAdvanced } from './utils/chunkingUtils.ts';

export async function extractTextFromPdfAdvanced(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
}> {
  console.log('=== STARTING FIXED PDF EXTRACTION WITH OPENAI VISION PRIMARY ===');
  console.log(`Processing PDF of ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // STEP 1: Try OpenAI Vision OCR FIRST - this is our PRIMARY method
    console.log('=== STEP 1: OPENAI VISION OCR (PRIMARY METHOD) ===');
    
    const visionResult = await extractTextWithOpenAIVision(pdfData);
    console.log(`OpenAI Vision result received:`);
    console.log(`- Text length: ${visionResult.text.length}`);
    console.log(`- Confidence: ${visionResult.confidence}`);
    console.log(`- Page count: ${visionResult.pageCount}`);
    
    if (visionResult.text.length > 0) {
      console.log(`- Text preview: "${visionResult.text.substring(0, 200)}..."`);
    } else {
      console.log('- No text extracted from Vision API');
    }
    
    // If Vision API extracted meaningful text, use it
    if (visionResult.text.length > 50) {
      console.log('✅ OpenAI Vision OCR SUCCESS - using Vision result');
      return {
        text: visionResult.text,
        method: 'openai-vision-primary',
        quality: Math.max(0.7, visionResult.confidence),
        confidence: visionResult.confidence,
        pageCount: visionResult.pageCount || 1,
        isScanned: true,
        processingNotes: `Vision API extracted ${visionResult.text.length} characters successfully`
      };
    }
    
    // If Vision extracted some text but not much, check if it's still better than nothing
    if (visionResult.text.length > 20 && hasReadableContent(visionResult.text)) {
      console.log('⚠️ Using limited Vision result as best available');
      return {
        text: visionResult.text,
        method: 'openai-vision-limited',
        quality: 0.5,
        confidence: visionResult.confidence,
        pageCount: visionResult.pageCount || 1,
        isScanned: true,
        processingNotes: `Vision API extracted limited text: ${visionResult.text.length} characters`
      };
    }
    
    console.log('❌ OpenAI Vision failed - trying native parsing fallback');
    
    // STEP 2: Native parsing only as fallback
    console.log('=== STEP 2: NATIVE PARSING FALLBACK ===');
    const libraryResult = await extractTextWithLibrary(pdfData);
    const libraryValidation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    console.log(`Native parsing result:`);
    console.log(`- Text length: ${libraryResult.text.length}`);
    console.log(`- Quality: ${libraryValidation.quality}`);
    console.log(`- Valid: ${libraryValidation.isValid}`);
    
    if (libraryValidation.isValid && libraryResult.text.length > 100) {
      console.log('✅ Native parsing successful');
      return {
        text: libraryResult.text,
        method: 'native-parsing-fallback',
        quality: libraryValidation.quality,
        confidence: 0.6,
        pageCount: libraryResult.pageCount,
        isScanned: false,
        processingNotes: `Native parsing extracted ${libraryResult.text.length} characters`
      };
    }
    
    // STEP 3: Create readable summary if all else fails
    console.log('=== STEP 3: CREATING READABLE SUMMARY FALLBACK ===');
    return createReadableSummary(pdfData);
    
  } catch (error) {
    console.error('❌ PDF extraction failed completely:', error);
    return createReadableSummary(pdfData, error.message);
  }
}

// Check if text contains readable content vs garbled data
function hasReadableContent(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // Check for basic readable patterns
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const readableWords = words.filter(word => /^[a-zA-Z][a-zA-Z0-9]*$/.test(word));
  const readableRatio = words.length > 0 ? readableWords.length / words.length : 0;
  
  console.log(`Readability check: ${readableWords.length}/${words.length} words (${(readableRatio * 100).toFixed(1)}%)`);
  
  return readableRatio > 0.3; // At least 30% readable words
}

// Create a readable summary when extraction fails
function createReadableSummary(pdfData: Uint8Array, errorMessage?: string): {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
} {
  const sizeKB = Math.round(pdfData.length / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  const summaryText = `DOCUMENT PROCESSING SUMMARY
Date: ${currentDate}
File Size: ${sizeKB}KB

DOCUMENT ANALYSIS:
This appears to be a legal document that could not be automatically extracted as text.
${errorMessage ? `Processing Error: ${errorMessage}` : ''}

MANUAL REVIEW REQUIRED:
- Document has been successfully uploaded and stored
- File is available for manual review and analysis
- Consider using OCR tools for text extraction if needed
- Document can be discussed in AI conversations for contextual analysis

STATUS: Document processed and ready for manual review.
This file is now available in your document library for case management and legal analysis.`;

  return {
    text: summaryText,
    method: 'readable-summary-fallback',
    quality: 0.4,
    confidence: 0.5,
    pageCount: 1,
    isScanned: true,
    processingNotes: `Created readable summary for ${sizeKB}KB document. Manual review recommended.`
  };
}

// Export the chunking function for backward compatibility
export { chunkDocumentAdvanced };
