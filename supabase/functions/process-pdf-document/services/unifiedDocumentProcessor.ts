
// Unified document processor for PDF, Word, and text files

import { extractTextWithPdfJs, validatePdfJsExtraction } from './pdfjsExtractionService.ts';
import { extractTextFromWord, validateWordExtraction } from './wordExtractionService.ts';

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

// Process PDF documents with pdf-parse
async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
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

// Process Word documents with mammoth.js
async function processWordDocument(docxData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
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

// Process text documents with enhanced encoding detection
async function processTextDocument(textData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing text document...');
  
  try {
    // Try UTF-8 first
    let text = new TextDecoder('utf-8').decode(textData);
    
    // If UTF-8 fails, try other encodings
    if (text.includes('�')) {
      console.log('⚠️ UTF-8 decoding issues, trying alternative encodings...');
      text = new TextDecoder('latin1').decode(textData);
    }
    
    text = text.trim();
    
    if (text.length < 10) {
      throw new Error('Text file is empty or too short');
    }
    
    console.log(`✅ Text extraction completed: ${text.length} characters`);
    
    return {
      text: text,
      method: 'text-file-processing',
      quality: 0.95, // High quality for plain text
      confidence: 0.99, // Very high confidence for text files
      fileType: 'txt',
      processingNotes: `Text file processing: ${text.length} characters extracted`
    };
    
  } catch (error) {
    throw new Error(`Text file processing failed: ${error.message}`);
  }
}

// Detect file type from filename, MIME type, and file signature
function detectFileType(fileName: string, mimeType?: string, fileData?: Uint8Array): string {
  // Check by MIME type first
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'docx';
    if (mimeType.includes('text/plain')) return 'txt';
  }
  
  // Check by file extension
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx') return 'docx';
  if (extension === 'txt') return 'txt';
  
  // Check by file signature (magic bytes)
  if (fileData && fileData.length > 4) {
    const signature = Array.from(fileData.slice(0, 8))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature.startsWith('25504446')) return 'pdf'; // %PDF
    if (signature.startsWith('504b0304')) return 'docx'; // ZIP signature (DOCX is ZIP-based)
  }
  
  // Default fallback
  console.warn(`⚠️ Could not detect file type for ${fileName}, defaulting to PDF`);
  return 'pdf';
}

// Create fallback summary when extraction fails
function createFallbackSummary(
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
