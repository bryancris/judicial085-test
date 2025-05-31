
// PDF document processor

import { extractTextWithPdfJs, validatePdfJsExtraction } from '../services/pdfjsExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing PDF document with pdf-parse...');
  
  const result = await extractTextWithPdfJs(pdfData);
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
    processingNotes: `pdf-parse extraction: ${result.pageCount} pages, ${result.text.length} characters, quality ${result.quality.toFixed(2)}`
  };
}
