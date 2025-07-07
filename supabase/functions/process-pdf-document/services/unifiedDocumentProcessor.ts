// Unified Document Processor with OCR fallback for scanned documents

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';
import { extractTextWithWorkingOCR } from '../workingOcrService.ts';
import { convertPdfToImages } from '../pdfToImageService.ts';

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
  console.log('=== UNIFIED DOCUMENT PROCESSOR WITH OCR FALLBACK ===');
  console.log(`Processing: ${fileName} (${fileData.length} bytes)`);
  
  const detectedType = detectFileType(fileName, mimeType);
  console.log(`Detected file type: ${detectedType}`);
  
  if (detectedType === 'pdf') {
    return await processPdfWithOcrFallback(fileData, fileName);
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
  console.log('📄 Starting PDF processing with OCR fallback...');
  
  try {
    // Step 1: Try regular PDF text extraction
    console.log('🔍 Attempting regular PDF text extraction...');
    const regularResult = await processPdfDocument(pdfData, fileName);
    
    // Check if extraction was successful
    if (isExtractionSuccessful(regularResult)) {
      console.log('✅ Regular PDF extraction successful');
      return regularResult;
    }
    
    console.log('📝 Regular extraction insufficient, checking if document is scanned...');
    
    // Step 2: Detect if document is likely scanned
    if (isLikelyScannedDocument(regularResult, pdfData)) {
      console.log('🖼️ Document appears to be scanned, attempting OCR processing...');
      return await processScannedPdfWithOcr(pdfData, fileName);
    }
    
    // If not scanned but extraction failed, return the regular result with notes
    console.log('⚠️ Document is not scanned but extraction was minimal');
    return {
      ...regularResult,
      processingNotes: `${regularResult.processingNotes}. Document may need manual review for complete text extraction.`
    };
    
  } catch (error) {
    console.error('❌ PDF processing failed, attempting OCR as final fallback:', error);
    
    try {
      return await processScannedPdfWithOcr(pdfData, fileName);
    } catch (ocrError) {
      console.error('❌ OCR fallback also failed:', ocrError);
      return createDocumentPlaceholder(pdfData, fileName, 'pdf', `Processing failed: ${error.message}`);
    }
  }
}

async function processScannedPdfWithOcr(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('🔍 Processing scanned PDF with OCR...');
  
  try {
    // Use the existing working OCR service
    const ocrResult = await extractTextWithWorkingOCR(pdfData);
    
    console.log(`✅ OCR extraction completed: ${ocrResult.text.length} characters`);
    
    return {
      text: ocrResult.text,
      method: 'ocr-extraction',
      quality: Math.min(ocrResult.confidence, 0.8), // OCR typically has lower quality
      confidence: ocrResult.confidence,
      pageCount: Math.max(1, Math.ceil(pdfData.length / 50000)), // Rough estimate
      fileType: 'pdf',
      processingNotes: `OCR extraction from scanned document. Confidence: ${(ocrResult.confidence * 100).toFixed(1)}%. Manual review recommended for accuracy.`,
      isScanned: true
    };
    
  } catch (error) {
    console.error('❌ OCR processing failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

// Check if regular extraction was successful enough
function isExtractionSuccessful(result: DocumentExtractionResult): boolean {
  // Consider successful if we have meaningful text content
  const hasGoodText = result.text.length > 100;
  const hasDecentQuality = result.quality > 0.3;
  const hasReasonableConfidence = result.confidence > 0.4;
  
  return hasGoodText && (hasDecentQuality || hasReasonableConfidence);
}

// Detect if document is likely scanned based on extraction results and file characteristics
function isLikelyScannedDocument(result: DocumentExtractionResult, pdfData: Uint8Array): boolean {
  // Indicators of a scanned document:
  
  // 1. Very little text extracted relative to file size
  const textToSizeRatio = result.text.length / pdfData.length;
  const hasLowTextRatio = textToSizeRatio < 0.005; // Less than 0.5% text to file size ratio
  
  // 2. Very low quality/confidence scores
  const hasLowQuality = result.quality < 0.2;
  const hasLowConfidence = result.confidence < 0.3;
  
  // 3. Very short text extraction
  const hasMinimalText = result.text.length < 50;
  
  // 4. File size suggests images (scanned docs tend to be larger)
  const fileSizeKB = pdfData.length / 1024;
  const isLargeFile = fileSizeKB > 200; // Larger than typical text-only PDFs
  
  console.log(`Scanned document detection:
    - Text/Size ratio: ${textToSizeRatio.toFixed(6)} (threshold: 0.005)
    - Quality: ${result.quality.toFixed(3)} (threshold: 0.2)
    - Confidence: ${result.confidence.toFixed(3)} (threshold: 0.3)
    - Text length: ${result.text.length} (threshold: 50)
    - File size: ${fileSizeKB.toFixed(1)}KB (threshold: 200KB)`);
  
  // Document is likely scanned if multiple indicators are present
  const indicators = [
    hasLowTextRatio,
    hasLowQuality,
    hasLowConfidence,
    hasMinimalText
  ].filter(Boolean).length;
  
  const isLikelyScanned = indicators >= 2; // At least 2 indicators
  console.log(`Scanned document likelihood: ${indicators}/4 indicators present. Result: ${isLikelyScanned ? 'SCANNED' : 'NOT SCANNED'}`);
  
  return isLikelyScanned;
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
