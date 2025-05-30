
// Core PDF extraction functions with timeout management

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
  
  const overallTimeout = 15000; // 15 seconds total timeout
  const startTime = Date.now();
  
  try {
    // Step 1: Analyze PDF structure first (quick operation)
    console.log('=== STEP 1: PDF STRUCTURE ANALYSIS ===');
    const structure = analyzePdfStructure(pdfData);
    
    if (Date.now() - startTime > overallTimeout) {
      console.log('⏰ Overall timeout reached during structure analysis');
      return createEnhancedSummary(pdfData, structure);
    }
    
    // Step 2: Enhanced text object extraction (with timeout)
    console.log('=== STEP 2: ENHANCED TEXT OBJECT EXTRACTION ===');
    const textObjectResult = await extractFromTextObjectsEnhanced(pdfData, structure);
    console.log(`Text objects result: ${textObjectResult.text.length} chars, quality: ${textObjectResult.quality}`);
    
    if (validateExtraction(textObjectResult) && textObjectResult.quality > 0.3) {
      console.log('✅ Text object extraction successful');
      return textObjectResult;
    }
    
    if (Date.now() - startTime > overallTimeout - 5000) {
      console.log('⏰ Timeout approaching, using text object result');
      return textObjectResult.text.length > 50 ? textObjectResult : createEnhancedSummary(pdfData, structure);
    }
    
    // Step 3: Enhanced stream extraction (if time permits)
    console.log('=== STEP 3: ENHANCED STREAM EXTRACTION ===');
    const streamResult = await extractFromStreamsEnhanced(pdfData, structure);
    console.log(`Stream result: ${streamResult.text.length} chars, quality: ${streamResult.quality}`);
    
    if (validateExtraction(streamResult) && streamResult.quality > 0.25) {
      console.log('✅ Stream extraction successful');
      return streamResult;
    }
    
    if (Date.now() - startTime > overallTimeout - 3000) {
      console.log('⏰ Timeout approaching, using best available result');
      const bestResult = streamResult.text.length > textObjectResult.text.length ? streamResult : textObjectResult;
      return bestResult.text.length > 30 ? bestResult : createEnhancedSummary(pdfData, structure);
    }
    
    // Step 4: Raw text scanning (quick fallback)
    console.log('=== STEP 4: RAW TEXT SCANNING ===');
    const rawTextResult = await extractFromRawText(pdfData, structure);
    console.log(`Raw text result: ${rawTextResult.text.length} chars, quality: ${rawTextResult.quality}`);
    
    if (validateExtraction(rawTextResult) && rawTextResult.quality > 0.2) {
      console.log('✅ Raw text scanning successful');
      return rawTextResult;
    }
    
    // Return best available result or fallback summary
    const results = [textObjectResult, streamResult, rawTextResult];
    const bestResult = results.reduce((best, current) => 
      current.text.length > best.text.length ? current : best
    );
    
    if (bestResult.text.length > 30) {
      console.log(`✅ Using best available result: ${bestResult.method}`);
      return bestResult;
    }
    
    // Final fallback
    console.log('❌ All extraction methods failed - creating enhanced summary');
    return createEnhancedSummary(pdfData, structure);
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    const structure = analyzePdfStructure(pdfData);
    return createEnhancedSummary(pdfData, structure);
  }
}
