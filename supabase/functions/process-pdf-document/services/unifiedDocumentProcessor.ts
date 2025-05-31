
// Unified document processor for PDF, Word, and text files

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';
import { processWordDocument } from '../processors/wordDocumentProcessor.ts';
import { processTextDocument } from '../processors/textDocumentProcessor.ts';
import { detectFileType } from '../utils/fileTypeDetector.ts';
import { createFallbackSummary } from '../utils/fallbackSummaryGenerator.ts';

export interface DocumentExtractionResult {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount?: number;
  fileType: string;
  processingNotes: string;
}

export async function processDocument(
  fileData: Uint8Array,
  fileName: string,
  mimeType?: string
): Promise<DocumentExtractionResult> {
  console.log('🚀 === STARTING UNIFIED DOCUMENT PROCESSING ===');
  console.log(`File: ${fileName}, Size: ${fileData.length} bytes (${Math.round(fileData.length / 1024)}KB)`);
  console.log(`MIME Type: ${mimeType || 'unknown'}`);
  
  const fileType = detectFileType(fileName, mimeType, fileData);
  console.log(`Detected file type: ${fileType}`);
  
  try {
    switch (fileType) {
      case 'pdf':
        return await processPdfDocument(fileData, fileName);
      
      case 'docx':
        return await processWordDocument(fileData, fileName);
      
      case 'txt':
        return await processTextDocument(fileData, fileName);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
  } catch (error) {
    console.error(`❌ Document processing failed for ${fileType}:`, error);
    
    // Create fallback summary
    return createFallbackSummary(fileData, fileName, fileType, error.message);
  }
}
