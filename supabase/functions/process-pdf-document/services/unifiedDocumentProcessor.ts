
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
  console.log(`MIME Type: ${mimeType || 'auto-detect from filename'}`);
  
  const fileType = detectFileType(fileName, mimeType, fileData);
  console.log(`Detected file type: ${fileType}`);
  
  try {
    switch (fileType) {
      case 'pdf':
        console.log('🔄 Routing to PDF processor...');
        return await processPdfDocument(fileData, fileName);
      
      case 'docx':
        console.log('🔄 Routing to Word document processor...');
        return await processWordDocument(fileData, fileName);
      
      case 'txt':
        console.log('🔄 Routing to text processor...');
        return await processTextDocument(fileData, fileName);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, TXT`);
    }
    
  } catch (error) {
    console.error(`❌ Document processing failed for ${fileType}:`, error);
    
    // Create fallback summary
    return createFallbackSummary(fileData, fileName, fileType, error.message);
  }
}
