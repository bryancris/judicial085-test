// Unified Document Processor with real OCR fallback for scanned documents

import { processPdfDocument } from '../processors/pdfDocumentProcessor.ts';

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
  console.log('📄 Starting simplified PDF processing with smart scanned detection...');
  
  // Quick scanned document detection
  const isLikelyScanned = await detectScannedDocument(pdfData, fileName);
  
  if (isLikelyScanned) {
    console.log('🖼️ Document appears to be scanned, going directly to OCR...');
    try {
      return await processScannedPdfWithOcr(pdfData, fileName);
    } catch (ocrError) {
      console.error('❌ OCR processing failed:', ocrError.message);
      // Fall back to standard processing as last resort
      console.log('🔄 OCR failed, trying standard extraction as fallback...');
    }
  }
  
  // Step 1: Try direct PDF text extraction (multiple methods)
  console.log('🔍 Attempting direct PDF text extraction...');
  try {
    const directResult = await processPdfDocument(pdfData, fileName);
    
    // Use stricter success criteria for better quality
    if (directResult.text.length > 200 && !isGarbageText(directResult.text)) {
      console.log('✅ Direct PDF extraction successful');
      return directResult;
    }
    console.log('📝 Direct extraction insufficient quality, proceeding to enhanced methods...');
  } catch (directError) {
    console.log('⚠️ Direct extraction failed:', directError.message, '- proceeding to enhanced methods...');
  }
  
  // Step 2: Try enhanced PDF text extraction
  console.log('🔧 Attempting enhanced PDF text extraction...');
  try {
    const enhancedResult = await tryEnhancedPdfExtraction(pdfData, fileName);
    if (enhancedResult.text.length > 100 && !isGarbageText(enhancedResult.text)) {
      console.log('✅ Enhanced PDF extraction successful');
      return enhancedResult;
    }
    console.log('📝 Enhanced extraction insufficient quality, proceeding to OCR...');
  } catch (enhancedError) {
    console.log('⚠️ Enhanced extraction failed:', enhancedError.message, '- proceeding to OCR...');
  }
  
  // Step 3: Use OCR for scanned documents (forced if we get here)
  console.log('🖼️ Standard extraction failed, using OCR processing...');
  try {
    return await processScannedPdfWithOcr(pdfData, fileName);
  } catch (ocrError) {
    console.error('❌ OCR processing failed:', ocrError.message);
    // Only use placeholder as absolute last resort
    return createDocumentPlaceholder(pdfData, fileName, 'pdf', `All processing methods failed. Last error: ${ocrError.message}`);
  }
}

// Smart scanned document detection
async function detectScannedDocument(pdfData: Uint8Array, fileName: string): Promise<boolean> {
  console.log('🔍 Detecting if document is scanned...');
  
  // Size-based heuristics (scanned documents are typically larger)
  const fileSizeIndicator = pdfData.length > 5 * 1024 * 1024; // > 5MB
  
  // Filename heuristics
  const nameIndicators = fileName.toLowerCase().includes('scan') || 
                        fileName.toLowerCase().includes('scanned') ||
                        fileName.toLowerCase().includes('copy');
  
  // Quick text extraction test
  let hasMinimalText = false;
  try {
    const quickTest = await processPdfDocument(pdfData, fileName);
    // If we get very little text or it's garbled, likely scanned
    hasMinimalText = quickTest.text.length < 100 || isGarbageText(quickTest.text);
  } catch {
    // If basic extraction fails completely, likely scanned
    hasMinimalText = true;
  }
  
  const isScanned = fileSizeIndicator || nameIndicators || hasMinimalText;
  console.log(`📊 Scanned detection: size=${fileSizeIndicator}, name=${nameIndicators}, minimalText=${hasMinimalText} → ${isScanned}`);
  
  return isScanned;
}

// Check for garbled/garbage text that indicates OCR is needed
function isGarbageText(text: string): boolean {
  if (!text || text.length < 20) return true;
  
  // Check for high ratio of special characters
  const specialChars = (text.match(/[^\w\s\.\,\!\?\-\(\)]/g) || []).length;
  const specialRatio = specialChars / text.length;
  
  // Check for repeated garbled patterns
  const garbagePatterns = [
    /[^\w\s]{5,}/g,  // 5+ consecutive non-word characters
    /(.)\1{4,}/g,    // 4+ repeated characters
    /^\s*[\?\.\-\*]{5,}/, // Starts with lots of special chars
  ];
  
  const hasGarbagePatterns = garbagePatterns.some(pattern => pattern.test(text));
  
  // Check for lack of real words
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const realWords = words.filter(word => /^[a-zA-Z]+$/.test(word));
  const wordRatio = words.length > 0 ? realWords.length / words.length : 0;
  
  const isGarbage = specialRatio > 0.3 || hasGarbagePatterns || wordRatio < 0.3;
  
  if (isGarbage) {
    console.log(`🗑️ Detected garbage text: specialRatio=${specialRatio.toFixed(2)}, patterns=${hasGarbagePatterns}, wordRatio=${wordRatio.toFixed(2)}`);
  }
  
  return isGarbage;
}

async function processScannedPdfWithOcr(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('🔍 Processing scanned PDF with simplified OCR...');
  
  // Only try Gemini Vision OCR with timeout protection
  console.log('🤖 Attempting Gemini Vision OCR for scanned document...');
  try {
    // Check if Gemini API key is available
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not available');
    }
    
    const { extractTextWithGeminiVision } = await import('./geminiVisionOcrService.ts');
    
    // Add timeout protection for Gemini OCR
    const geminiResult = await Promise.race([
      extractTextWithGeminiVision(pdfData, fileName),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini Vision OCR timeout after 15 seconds')), 15000)
      )
    ]) as any;
    
    // Validate the result quality
    if (geminiResult.text && geminiResult.text.length > 50) {
      console.log(`✅ Gemini Vision OCR successful: ${geminiResult.text.length} characters, confidence: ${geminiResult.confidence}`);
      
      return {
        text: geminiResult.text,
        method: 'Gemini Vision OCR',
        quality: geminiResult.confidence || 0.7,
        confidence: geminiResult.confidence || 0.7,
        pageCount: geminiResult.pageCount || Math.max(1, Math.ceil(pdfData.length / 50000)),
        fileType: 'pdf',
        processingNotes: `Successfully processed scanned document using Gemini Vision OCR. Text length: ${geminiResult.text.length} characters.`,
        isScanned: true
      };
    } else {
      throw new Error('Gemini Vision result quality insufficient');
    }
    
  } catch (geminiError) {
    console.error(`❌ Gemini Vision OCR failed: ${geminiError.message}`);
    
    // Create a more informative placeholder for scanned documents
    const placeholderText = `SCANNED DOCUMENT DETECTED
File: ${fileName}
Size: ${Math.round(pdfData.length / 1024)}KB

This appears to be a scanned document that could not be processed with OCR.
The document has been uploaded and is available for manual review.

Reason: ${geminiError.message}

Please consider:
1. Re-uploading if this is a text-based PDF
2. Manual review of the document content
3. Using alternative OCR tools if text extraction is critical`;

    return {
      text: placeholderText,
      method: 'scanned-placeholder',
      quality: 0.3,
      confidence: 0.4,
      pageCount: Math.max(1, Math.ceil(pdfData.length / 50000)),
      fileType: 'pdf',
      processingNotes: `Scanned document OCR failed: ${geminiError.message}`,
      isScanned: true
    };
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
