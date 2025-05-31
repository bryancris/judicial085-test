
// PDF document processor using pdf-parse exclusively

import { extractTextWithPdfJs, validatePdfJsExtraction } from '../services/pdfjsExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing PDF document with pdf-parse...');
  
  try {
    // Use pdf-parse directly
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
    
    // Calculate quality
    const quality = calculatePdfQuality(extractedText, pageCount);
    const confidence = Math.min(0.90, quality + 0.1);
    
    // Validate extraction
    const validation = validatePdfJsExtraction(extractedText, pageCount);
    
    if (!validation.isValid) {
      throw new Error(`PDF extraction validation failed: ${validation.issues.join(', ')}`);
    }
    
    return {
      text: extractedText,
      method: 'pdf-parse-direct',
      quality: quality,
      confidence: confidence,
      pageCount: pageCount,
      fileType: 'pdf',
      processingNotes: `pdf-parse extraction: ${pageCount} pages, ${extractedText.length} characters, quality ${quality.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

function calculatePdfQuality(text: string, pageCount: number): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.75; // Good base quality for pdf-parse
  
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const sentences = text.match(/[.!?]+/g) || [];
  
  if (words.length > 50) quality += 0.05;
  if (sentences.length > 3) quality += 0.05;
  
  // Legal content boost
  const legalTerms = ['attorney', 'law', 'court', 'case', 'legal', 'dtpa', 'demand'];
  const hasLegalTerms = legalTerms.some(term => text.toLowerCase().includes(term));
  
  if (hasLegalTerms) {
    quality += 0.1;
  }
  
  return Math.max(0.1, Math.min(0.95, quality));
}
