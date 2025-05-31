
// PDF document processor using Deno-compatible PDF.js

import { extractTextWithPdfJs, validatePdfJsExtraction } from '../services/pdfjsExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing PDF document with Deno-compatible PDF.js...');
  
  try {
    const result = await extractTextWithPdfJs(pdfData);
    
    console.log(`✅ PDF.js extraction completed: ${result.text.length} characters from ${result.pageCount} pages`);
    
    // Validate extraction
    const validation = validatePdfJsExtraction(result.text, result.pageCount);
    
    if (!validation.isValid) {
      throw new Error(`PDF extraction validation failed: ${validation.issues.join(', ')}`);
    }
    
    return {
      text: result.text,
      method: result.method,
      quality: result.quality,
      confidence: result.confidence,
      pageCount: result.pageCount,
      fileType: 'pdf',
      processingNotes: `PDF.js extraction: ${result.pageCount} pages, ${result.text.length} characters, quality ${result.quality.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}
