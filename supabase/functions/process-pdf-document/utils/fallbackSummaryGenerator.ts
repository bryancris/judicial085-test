
// Fallback summary generator for when extraction fails

import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export function createFallbackSummary(
  fileData: Uint8Array,
  fileName: string,
  fileType: string,
  errorMessage: string
): DocumentExtractionResult {
  const sizeKB = Math.round(fileData.length / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  const summaryText = `DOCUMENT PROCESSING SUMMARY
Date Processed: ${currentDate}
File Name: ${fileName}
File Type: ${fileType.toUpperCase()}
File Size: ${sizeKB}KB

DOCUMENT STATUS:
This ${fileType.toUpperCase()} document has been uploaded to your case management system.

PROCESSING NOTES:
- Document processing attempted with pdf-parse and mammoth.js
- File is stored and available for manual review
- Document can be downloaded and viewed directly
- Content can be discussed in AI conversations

TECHNICAL DETAILS:
Processing Error: ${errorMessage}
Recommended Action: Manual document review or try re-uploading

This document is now part of your legal case file and available for legal AI analysis.`;

  return {
    text: summaryText,
    method: 'fallback-summary',
    quality: 0.5,
    confidence: 0.6,
    fileType: fileType,
    processingNotes: `Fallback summary created for ${sizeKB}KB ${fileType} file. Error: ${errorMessage}`
  };
}
