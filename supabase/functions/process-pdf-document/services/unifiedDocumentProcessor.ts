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
    
    // Check if we got substantial text (be more lenient for legal documents)
    if (directResult.text.length > 1000 && !isGarbageText(directResult.text)) {
      console.log('✅ Normal PDF extraction successful - substantial text found');
      return directResult;
    }
    
    // Even if text seems "low quality", prefer it over OCR if it's substantial
    if (directResult.text.length > 10000) {
      console.log('✅ Normal PDF extraction has substantial content - using despite quality concerns');
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


// Much more lenient garbage text detection, especially for legal documents
function isGarbageText(text: string): boolean {
  if (!text || text.length < 10) return true;
  
  // Check for legal document indicators - never mark legal content as garbage
  const legalIndicators = [
    /\b(ARTICLE|SECTION|WHEREAS|THEREFORE|HEREIN|COVENANT|BYLAW|AMENDMENT|DECLARATION|CHARTER)\b/i,
    /\b(HOMEOWNERS|ASSOCIATION|HOA|PROPERTY|RESIDENT|COMMUNITY|BOARD|DIRECTORS)\b/i,
    /\b(ATTORNEY|LEGAL|COURT|CASE|MOTION|DEFENDANT|PLAINTIFF)\b/i,
    /\b(AGREEMENT|CONTRACT|LEASE|DEED|TITLE|MORTGAGE)\b/i
  ];
  
  const hasLegalContent = legalIndicators.some(pattern => pattern.test(text));
  if (hasLegalContent) {
    console.log('📋 Legal document content detected - not garbage');
    return false;
  }
  
  // Only check for truly corrupted binary data patterns
  const binaryPatterns = [
    /[\x00-\x08\x0E-\x1F\x7F-\xFF]{10,}/g, // Binary data sequences
    /^[^\w\s]{50,}/, // Starts with 50+ non-alphanumeric chars
    /(.)\1{20,}/g,   // 20+ identical characters in a row
  ];
  
  const hasBinaryPatterns = binaryPatterns.some(pattern => pattern.test(text));
  
  // Check if text has any recognizable words at all
  const hasWords = /\b[a-zA-Z]{3,}\b/.test(text);
  
  // Only mark as garbage if it's clearly corrupted binary data with no readable words
  const isGarbage = hasBinaryPatterns && !hasWords;
  
  if (isGarbage) {
    console.log(`🗑️ Detected corrupted binary data: hasWords=${hasWords}, binaryPatterns=${hasBinaryPatterns}`);
  } else if (text.length > 1000) {
    console.log(`✅ Text appears valid: ${text.length} characters, hasLegal=${hasLegalContent}, hasWords=${hasWords}`);
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
