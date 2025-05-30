
// Core PDF extraction functions

import { analyzePdfStructure } from '../extractors/pdfStructureAnalyzer.ts';
import { extractFromTextObjectsEnhanced } from '../extractors/textObjectExtractor.ts';
import { extractFromStreamsEnhanced } from '../extractors/streamExtractor.ts';
import { extractFromRawText } from '../extractors/rawTextExtractor.ts';
import { extractFromCharacterCodes } from '../extractors/characterCodeExtractor.ts';
import { createEnhancedSummary } from '../utils/summaryUtils.ts';
import { validateExtraction } from '../utils/validationUtils.ts';

export async function extractTextFromPdfReal(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('=== STARTING ENHANCED REAL PDF TEXT EXTRACTION ===');
  console.log(`Processing PDF of ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Step 1: Analyze PDF structure first
    console.log('=== STEP 1: PDF STRUCTURE ANALYSIS ===');
    const structure = analyzePdfStructure(pdfData);
    
    // Step 2: Enhanced text object extraction
    console.log('=== STEP 2: ENHANCED TEXT OBJECT EXTRACTION ===');
    const textObjectResult = await extractFromTextObjectsEnhanced(pdfData, structure);
    console.log(`Text objects result: ${textObjectResult.text.length} chars, quality: ${textObjectResult.quality}`);
    
    if (validateExtraction(textObjectResult) && textObjectResult.quality > 0.3) {
      console.log('✅ Text object extraction successful');
      return textObjectResult;
    }
    
    // Step 3: Enhanced stream extraction with decompression
    console.log('=== STEP 3: ENHANCED STREAM EXTRACTION ===');
    const streamResult = await extractFromStreamsEnhanced(pdfData, structure);
    console.log(`Stream result: ${streamResult.text.length} chars, quality: ${streamResult.quality}`);
    
    if (validateExtraction(streamResult) && streamResult.quality > 0.25) {
      console.log('✅ Stream extraction successful');
      return streamResult;
    }
    
    // Step 4: Raw text scanning for readable content
    console.log('=== STEP 4: RAW TEXT SCANNING ===');
    const rawTextResult = await extractFromRawText(pdfData, structure);
    console.log(`Raw text result: ${rawTextResult.text.length} chars, quality: ${rawTextResult.quality}`);
    
    if (validateExtraction(rawTextResult) && rawTextResult.quality > 0.2) {
      console.log('✅ Raw text scanning successful');
      return rawTextResult;
    }
    
    // Step 5: Character code extraction as final attempt
    console.log('=== STEP 5: CHARACTER CODE EXTRACTION ===');
    const charCodeResult = await extractFromCharacterCodes(pdfData, structure);
    console.log(`Character code result: ${charCodeResult.text.length} chars, quality: ${charCodeResult.quality}`);
    
    if (validateExtraction(charCodeResult) && charCodeResult.quality > 0.15) {
      console.log('✅ Character code extraction successful');
      return charCodeResult;
    }
    
    // If all methods fail, return enhanced summary
    console.log('❌ All extraction methods failed - creating enhanced summary');
    return createEnhancedSummary(pdfData, structure);
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    const structure = analyzePdfStructure(pdfData);
    return createEnhancedSummary(pdfData, structure);
  }
}
