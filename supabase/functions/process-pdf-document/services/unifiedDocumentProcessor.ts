// Unified Document Processor - Simplified approach
// Normal PDF extraction -> Mistral OCR fallback

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';
import { extractTextWithMistralOcr } from './mistralOcrService.ts';

export interface DocumentExtractionResult {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  fileType: string;
  processingNotes: string;
  isScanned?: boolean;
}

export async function processDocument(
  fileData: Uint8Array,
  fileName: string,
  mimeType?: string
): Promise<DocumentExtractionResult> {
  console.log('=== UNIFIED DOCUMENT PROCESSOR WITH ROBUST ERROR HANDLING ===');
  console.log(`Processing: ${fileName} (${fileData.length} bytes)`);
  
  const detectedType = detectFileType(fileName, mimeType);
  console.log(`Detected file type: ${detectedType}`);
  
  if (detectedType === 'pdf') {
    try {
      return await processPdfWithOcrFallback(fileData, fileName);
    } catch (error) {
      console.error('❌ PDF processing completely failed:', error);
      // Use fallback summary when all processing methods fail
      const { createFallbackSummary } = await import('../utils/fallbackSummaryGenerator.ts');
      return createFallbackSummary(fileData, fileName, detectedType, error.message);
    }
  }
  
  // For other file types, use existing processors
  if (detectedType === 'docx') {
    console.log('Word document processing not yet implemented - creating placeholder');
    return createDocumentPlaceholder(fileData, fileName, 'docx');
  }
  
  throw new Error(`Unsupported file type: ${detectedType}`);
}

async function processPdfWithOcrFallback(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('📄 Starting simple PDF processing...');
  
  // Step 1: Try normal PDF text extraction with pdf-parse
  console.log('🔍 Attempting normal PDF text extraction...');
  try {
    const directResult = await processPdfDocument(pdfData, fileName);
    
    // Check if we got good quality text
    if (directResult.text.length > 50 && !isGarbageText(directResult.text)) {
      console.log('✅ Normal PDF extraction successful');
      return directResult;
    }
    console.log('📝 Normal extraction produced low quality text, creating placeholder...');
  } catch (directError) {
    console.log('⚠️ Normal extraction failed:', directError.message, '- creating placeholder...');
  }
  
  // Step 2: Try Mistral OCR
  console.log('🤖 Step 2: Using Mistral OCR for scanned PDF...');
  try {
    const ocrResult = await extractTextWithMistralOcr(pdfData);
    
    return {
      text: ocrResult.text,
      method: "mistral-ocr",
      quality: ocrResult.confidence,
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount || Math.max(1, Math.ceil(pdfData.length / 50000)),
      fileType: "pdf",
      processingNotes: `Successfully processed using Mistral OCR. Extracted ${ocrResult.text.length} characters from ${ocrResult.pageCount || 1} pages.`
    };
    
  } catch (ocrError) {
    console.error('❌ Mistral OCR failed:', ocrError.message);
    // Only use placeholder as last resort
    return createDocumentPlaceholder(pdfData, fileName, 'pdf', `Normal PDF text extraction and OCR both failed. The document has been uploaded and is available for manual review. Error: ${ocrError.message}`);
  }
}


// Improved garbage text detection with more lenient criteria
function isGarbageText(text: string): boolean {
  if (!text || text.length < 20) return true;
  
  // Check for high ratio of special characters (more lenient)
  const specialChars = (text.match(/[^\w\s\.\,\!\?\-\(\)\:\;\'\"\[\]]/g) || []).length;
  const specialRatio = specialChars / text.length;
  
  // More specific garbage patterns
  const garbagePatterns = [
    /[^\w\s]{8,}/g,  // 8+ consecutive non-word characters (increased threshold)
    /(.)\1{6,}/g,    // 6+ repeated characters (increased threshold)
    /^[\?\.\-\*\s]{10,}/, // Starts with lots of special chars
    /^[^a-zA-Z0-9\s]{20,}/, // Starts with 20+ non-alphanumeric
  ];
  
  const hasGarbagePatterns = garbagePatterns.some(pattern => pattern.test(text));
  
  // Check for lack of real words (more lenient)
  const words = text.split(/\s+/).filter(word => word.length > 1);
  const realWords = words.filter(word => /^[a-zA-Z0-9]+$/.test(word) || /^[a-zA-Z]+$/.test(word));
  const wordRatio = words.length > 0 ? realWords.length / words.length : 0;
  
  // Check for readable content indicators
  const hasReadableContent = /\b(?:the|and|or|to|of|in|for|with|by|from|that|this|is|was|are|were|will|would|could|should)\b/i.test(text);
  
  // More lenient criteria - only mark as garbage if severely corrupted
  const isGarbage = (specialRatio > 0.5 && !hasReadableContent) || 
                   hasGarbagePatterns || 
                   (wordRatio < 0.15 && !hasReadableContent);
  
  if (isGarbage) {
    console.log(`🗑️ Detected garbage text: specialRatio=${specialRatio.toFixed(2)}, patterns=${hasGarbagePatterns}, wordRatio=${wordRatio.toFixed(2)}, readable=${hasReadableContent}`);
  }
  
  return isGarbage;
}


function detectFileType(fileName: string, mimeType?: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx';
  }
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    default:
      return 'unknown';
  }
}

function createDocumentPlaceholder(
  fileData: Uint8Array,
  fileName: string,
  fileType: string,
  errorMessage?: string
): DocumentExtractionResult {
  const sizeKB = Math.round(fileData.length / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  const summaryText = `DOCUMENT PROCESSING SUMMARY
Date Processed: ${currentDate}
File Name: ${fileName}
File Size: ${sizeKB}KB
File Type: ${fileType.toUpperCase()}

DOCUMENT STATUS:
This document has been uploaded to your case management system.

${errorMessage ? `PROCESSING NOTE: ${errorMessage}` : 'EXTRACTION NOTE: Document content extraction was limited.'}

NEXT STEPS:
1. Document is available for manual review
2. You can reference this file in legal AI conversations
3. Consider re-uploading if this is a text-based document
4. For scanned documents, OCR processing has been attempted

This document is now part of your legal case file and available for analysis.`;

  return {
    text: summaryText,
    method: 'placeholder-fallback',
    quality: 0.5,
    confidence: 0.6,
    pageCount: Math.max(1, Math.ceil(sizeKB / 50)),
    fileType: fileType,
    processingNotes: `Created document placeholder${errorMessage ? `: ${errorMessage}` : ''}`
  };
}
