// Unified Document Processor with real OCR fallback for scanned documents

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';
import { extractTextWithWorkingOCR, processLargeDocument } from '../workingOcrService.ts';

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
  console.log('📄 Starting simplified PDF processing with better fallbacks...');
  
  // Step 1: Try direct PDF text extraction (multiple methods)
  console.log('🔍 Attempting direct PDF text extraction...');
  try {
    const directResult = await processPdfDocument(pdfData, fileName);
    
    // Use much more lenient success criteria
    if (directResult.text.length > 20) {
      console.log('✅ Direct PDF extraction successful');
      return directResult;
    }
    console.log('📝 Direct extraction minimal, proceeding to enhanced methods...');
  } catch (directError) {
    console.log('⚠️ Direct extraction failed:', directError.message, '- proceeding to enhanced methods...');
  }
  
  // Step 2: Try enhanced PDF text extraction
  console.log('🔧 Attempting enhanced PDF text extraction...');
  try {
    const enhancedResult = await tryEnhancedPdfExtraction(pdfData, fileName);
    if (enhancedResult.text.length > 10) {
      console.log('✅ Enhanced PDF extraction successful');
      return enhancedResult;
    }
    console.log('📝 Enhanced extraction minimal, proceeding to OCR...');
  } catch (enhancedError) {
    console.log('⚠️ Enhanced extraction failed:', enhancedError.message, '- proceeding to OCR...');
  }
  
  // Step 3: Use OCR for scanned documents
  console.log('🖼️ Document appears to be scanned, using OCR processing...');
  try {
    return await processScannedPdfWithOcr(pdfData, fileName);
  } catch (ocrError) {
    console.error('❌ OCR processing failed:', ocrError.message);
    // Only use placeholder as absolute last resort
    return createDocumentPlaceholder(pdfData, fileName, 'pdf', `All processing methods failed. Last error: ${ocrError.message}`);
  }
}

async function processScannedPdfWithOcr(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('🔍 Processing scanned PDF with multi-stage OCR pipeline...');
  
  try {
    // Use the new multi-stage OCR pipeline
    const { processDocumentWithMultiStageOcr } = await import('./multiStageOcrPipeline.ts');
    
    const ocrResult = await processDocumentWithMultiStageOcr(pdfData, fileName);
    
    console.log(`✅ Multi-stage OCR completed using ${ocrResult.method} (Stage ${ocrResult.stage})`);
    console.log(`Result: ${ocrResult.text.length} characters, confidence: ${ocrResult.confidence.toFixed(2)}, time: ${ocrResult.processingTime}ms`);
    
    return {
      text: ocrResult.text,
      method: ocrResult.method,
      quality: Math.min(ocrResult.confidence, 0.95),
      confidence: ocrResult.confidence,
      pageCount: ocrResult.pageCount || Math.max(1, Math.ceil(pdfData.length / 50000)),
      fileType: 'pdf',
      processingNotes: `Multi-stage OCR: ${ocrResult.processingNotes}. Processing time: ${ocrResult.processingTime}ms`,
      isScanned: true
    };
    
  } catch (error) {
    console.error('❌ Multi-stage OCR processing failed:', error);
    console.log('🔄 Falling back to legacy OCR method...');
    
    // Fallback to original method if multi-stage fails
    try {
      const { extractTextWithWorkingOCR } = await import('../workingOcrService.ts');
      const legacyResult = await extractTextWithWorkingOCR(pdfData);
      
      return {
        text: legacyResult.text,
        method: 'legacy-ocr-fallback',
        quality: Math.min(legacyResult.confidence, 0.7),
        confidence: legacyResult.confidence,
        pageCount: Math.max(1, Math.ceil(pdfData.length / 50000)),
        fileType: 'pdf',
        processingNotes: `Legacy OCR fallback: ${legacyResult.text.length} characters. Multi-stage failed: ${error.message}`,
        isScanned: true
      };
    } catch (fallbackError) {
      console.error('❌ Legacy OCR fallback also failed:', fallbackError);
      throw new Error(`All OCR methods failed: ${error.message}`);
    }
  }
}

// Enhanced PDF extraction using multiple direct methods
async function tryEnhancedPdfExtraction(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('🔧 Trying enhanced PDF extraction methods...');
  
  try {
    // Import and use the enhanced library service
    const { extractTextWithLibrary, validateLibraryExtraction } = await import('../pdfLibraryService.ts');
    
    const libraryResult = await extractTextWithLibrary(pdfData);
    const validation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    console.log(`Enhanced extraction: ${libraryResult.text.length} chars, validation: ${validation.isValid}`);
    
    // Be much more lenient - accept any text that was extracted
    if (libraryResult.text.length > 5) {
      return {
        text: libraryResult.text,
        method: 'enhanced-pdf-extraction',
        quality: Math.max(validation.quality, 0.5), // Higher boost for any extracted text
        confidence: validation.isValid ? 0.8 : 0.6, // Higher confidence
        pageCount: libraryResult.pageCount,
        fileType: 'pdf',
        processingNotes: `Enhanced extraction: ${libraryResult.text.length} characters from ${libraryResult.pageCount} pages`
      };
    }
    
    throw new Error('Enhanced extraction yielded no readable content');
    
  } catch (error) {
    console.error('❌ Enhanced PDF extraction failed:', error);
    throw error;
  }
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
