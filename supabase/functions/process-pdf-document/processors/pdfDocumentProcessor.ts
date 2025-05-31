
// PDF document processor using reliable pdf-parse

import { extractTextWithPdfParse, validatePdfParseExtraction } from '../services/pdfParseExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing PDF document with pdf-parse...');
  
  try {
    const result = await extractTextWithPdfParse(pdfData);
    
    console.log(`✅ pdf-parse extraction completed: ${result.text.length} characters from ${result.pageCount} pages`);
    
    // Validate extraction
    const validation = validatePdfParseExtraction(result.text, result.pageCount);
    
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
      processingNotes: `pdf-parse extraction: ${result.pageCount} pages, ${result.text.length} characters, quality ${result.quality.toFixed(2)}`
    };
    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}
