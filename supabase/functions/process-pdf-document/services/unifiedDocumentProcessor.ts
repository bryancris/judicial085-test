/**
 * ====================================================================
 * UNIFIED DOCUMENT PROCESSOR - MAIN ORCHESTRATION LOGIC
 * ====================================================================
 * 
 * This module coordinates the entire document processing pipeline using a
 * 3-step fallback strategy designed for legal documents.
 * 
 * PROCESSING STRATEGY:
 * 
 * Step 1: STANDARD PDF TEXT EXTRACTION (pdf-parse)
 * - Uses pdf-parse library for fast, reliable text extraction
 * - Works well for digitally-created PDFs with embedded text
 * - Optimized for legal documents (lenient quality thresholds)
 * - Completes in 2-5 seconds for most documents
 * 
 * Step 2: MISTRAL OCR FALLBACK (for scanned PDFs)
 * - Triggered when pdf-parse fails or produces low-quality text
 * - Uploads PDF to Mistral's file storage temporarily
 * - Processes in 8-page chunks for large documents (>8 pages)
 * - Uses advanced OCR with structured text extraction
 * - Can take 30-40 seconds for large documents
 * - Automatically cleans up uploaded files
 * 
 * Step 3: PLACEHOLDER FALLBACK (last resort)
 * - Creates informative summary when all extraction methods fail
 * - Documents are still stored and available for manual review
 * - Provides metadata about the processing attempt
 * 
 * LEGAL DOCUMENT OPTIMIZATION:
 * - Recognizes legal terminology and formatting
 * - Never rejects content that contains legal indicators
 * - Uses lenient quality thresholds for complex legal language
 * - Preserves document structure and formatting where possible
 */

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';
import { extractTextWithMistralOcr } from './mistralOcrService.ts';
import { processWordDocument } from '../processors/wordDocumentProcessor.ts';

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

/**
 * MAIN DOCUMENT PROCESSING ENTRY POINT
 * 
 * Orchestrates the entire document processing workflow:
 * 1. Detects file type based on extension and MIME type
 * 2. Routes to appropriate processor (currently PDF-focused)
 * 3. Handles errors gracefully with fallback summaries
 * 
 * @param fileData - Raw file bytes from upload
 * @param fileName - Original filename for type detection
 * @param mimeType - Optional MIME type for validation
 * @returns DocumentExtractionResult with text, metadata, and processing info
 */
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
    try {
      console.log('📄 Processing Word document with mammoth.js...');
      return await processWordDocument(fileData, fileName);
    } catch (error) {
      console.error('❌ Word document processing failed:', error);
      return createDocumentPlaceholder(fileData, fileName, 'docx', `Word document processing failed: ${error.message}`);
    }
  }
  
  throw new Error(`Unsupported file type: ${detectedType}`);
}

/**
 * PDF PROCESSING WITH OCR FALLBACK
 * 
 * Implements the 3-step processing strategy:
 * 
 * STEP 1: STANDARD PDF EXTRACTION
 * - Uses pdf-parse for fast text extraction from digital PDFs
 * - Accepts documents with >1000 characters of quality text
 * - Prefers substantial content (>10,000 chars) even if quality is questionable
 * - This handles most modern legal documents created digitally
 * 
 * STEP 2: MISTRAL OCR PROCESSING
 * - Triggered when Step 1 fails or produces insufficient text
 * - Designed for scanned documents or image-based PDFs
 * - Uses advanced AI-powered OCR for accurate text recognition
 * - Handles complex legal document layouts and formatting
 * 
 * STEP 3: PLACEHOLDER CREATION (handled by caller)
 * - Creates informative fallback when both methods fail
 * - Documents remain accessible for manual review
 */
async function processPdfWithOcrFallback(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('📄 Starting PDF processing with OCR fallback strategy...');
  
  // STEP 1: STANDARD PDF TEXT EXTRACTION
  console.log('🔍 Step 1: Attempting standard PDF text extraction with pdf-parse...');
  try {
    const directResult = await processPdfDocument(pdfData, fileName);
    
    // Check if we got substantial text (be more lenient for legal documents)
    if (directResult.text.length > 1000 && !isGarbageText(directResult.text)) {
      console.log('✅ Step 1 successful - substantial quality text found');
      return directResult;
    }
    
    // Even if text seems "low quality", prefer it over OCR if it's substantial
    if (directResult.text.length > 10000) {
      console.log('✅ Step 1 has substantial content - using despite quality concerns');
      return directResult;
    }
    console.log('📝 Step 1 produced insufficient text, proceeding to OCR...');
  } catch (directError) {
    console.log('⚠️ Step 1 failed:', directError.message, '- proceeding to OCR...');
  }
  
  // STEP 2: MISTRAL OCR PROCESSING
  console.log('🤖 Step 2: Using Mistral OCR for scanned/image-based PDF...');
  try {
    const ocrResult = await extractTextWithMistralOcr(pdfData);
    
    return {
      text: ocrResult.text,
      method: "mistral-ocr",
      quality: ocrResult.confidence,
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount || Math.max(1, Math.ceil(pdfData.length / 50000)),
      fileType: "pdf",
      processingNotes: `Successfully processed using Mistral OCR. Extracted ${ocrResult.text.length} characters from ${ocrResult.pageCount || 1} pages.`,
      isScanned: true // Mark as scanned document for tracking
    };
    
  } catch (ocrError) {
    console.error('❌ Step 2 (Mistral OCR) failed:', ocrError.message);
    // STEP 3: Fallback placeholder (handled by caller)
    return createDocumentPlaceholder(pdfData, fileName, 'pdf', `Normal PDF text extraction and OCR both failed. The document has been uploaded and is available for manual review. Error: ${ocrError.message}`);
  }
}


/**
 * LEGAL DOCUMENT-OPTIMIZED TEXT QUALITY DETECTION
 * 
 * This function determines if extracted text is garbage/corrupted or valid content.
 * It's specifically optimized for legal documents which may have:
 * - Complex formatting and special characters
 * - Legal jargon that might seem "low quality" to generic algorithms
 * - Mixed fonts and styles from scanned originals
 * 
 * LEGAL DOCUMENT PROTECTION:
 * - Never rejects text containing legal terminology
 * - Recognizes common legal document patterns
 * - Accounts for formal legal language structures
 * 
 * CORRUPTION DETECTION:
 * - Only rejects text that's clearly binary data or completely unreadable
 * - Requires multiple indicators of corruption before rejection
 * - Preserves borderline cases for legal review
 */
function isGarbageText(text: string): boolean {
  if (!text || text.length < 10) return true;
  
  // LEGAL CONTENT DETECTION - Never reject legal documents
  const legalIndicators = [
    /\b(ARTICLE|SECTION|WHEREAS|THEREFORE|HEREIN|COVENANT|BYLAW|AMENDMENT|DECLARATION|CHARTER)\b/i,
    /\b(HOMEOWNERS|ASSOCIATION|HOA|PROPERTY|RESIDENT|COMMUNITY|BOARD|DIRECTORS)\b/i,
    /\b(ATTORNEY|LEGAL|COURT|CASE|MOTION|DEFENDANT|PLAINTIFF)\b/i,
    /\b(AGREEMENT|CONTRACT|LEASE|DEED|TITLE|MORTGAGE)\b/i
  ];
  
  const hasLegalContent = legalIndicators.some(pattern => pattern.test(text));
  if (hasLegalContent) {
    console.log('📋 Legal document content detected - preserving text');
    return false;
  }
  
  // BINARY CORRUPTION DETECTION - Only reject truly corrupted data
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
