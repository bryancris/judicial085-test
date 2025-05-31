
// Word document processor

import { extractTextFromWord, validateWordExtraction } from '../services/wordExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processWordDocument(docxData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing Word document with mammoth.js...');
  
  const result = await extractTextFromWord(docxData);
  const validation = validateWordExtraction(result.text);
  
  if (!validation.isValid) {
    throw new Error(`Word extraction validation failed: ${validation.issues.join(', ')}`);
  }
  
  return {
    text: result.text,
    method: result.method,
    quality: result.quality,
    confidence: result.confidence,
    fileType: 'docx',
    processingNotes: `Mammoth.js extraction: ${result.text.length} characters, quality ${result.quality.toFixed(2)}`
  };
}
