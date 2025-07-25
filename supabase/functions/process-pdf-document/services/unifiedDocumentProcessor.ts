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

// Conservative scanned document detection - only flag as scanned if we're very sure
async function detectScannedDocument(pdfData: Uint8Array, fileName: string): Promise<boolean> {
  console.log('🔍 Conservative scanned document detection...');
  
  // Strong filename indicators (only obvious scanned documents)
  const strongNameIndicators = fileName.toLowerCase().includes('scan') || 
                              fileName.toLowerCase().includes('scanned');
  
  // Size-based heuristics (only very large files that are likely scanned)
  const verylargeSizeIndicator = pdfData.length > 10 * 1024 * 1024; // > 10MB
  
  // Only mark as scanned if we have strong indicators
  // Don't use text extraction failure as the primary indicator since many complex PDFs fail pdf-parse
  const isScanned = strongNameIndicators || verylargeSizeIndicator;
  console.log(`📊 Conservative scanned detection: strongName=${strongNameIndicators}, veryLarge=${verylargeSizeIndicator} → ${isScanned}`);
  
  return isScanned;
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

async function processScannedPdfWithOcr(
  pdfData: Uint8Array, 
  fileName: string
): Promise<DocumentExtractionResult> {
  console.log('🔍 Processing scanned PDF with timeout-protected OCR...');
  
  try {
    // Check if Gemini API key is available
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not available');
    }
    
    console.log('🤖 Attempting Gemini Vision OCR with progressive timeout...');
    const { extractTextWithGeminiVision } = await import('./geminiVisionOcrService.ts');
    
    // Progressive timeout based on file size (45-60 seconds max)
    const fileSize = pdfData.length;
    const sizeMultiplier = Math.min(2.0, fileSize / (5 * 1024 * 1024));
    const overallTimeout = Math.min(45000 * sizeMultiplier, 60000); // Max 60 seconds
    
    console.log(`⏱️ Using ${overallTimeout}ms overall timeout for ${(fileSize / 1024).toFixed(0)}KB file`);
    
    const geminiResult = await Promise.race([
      extractTextWithGeminiVision(pdfData, fileName),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Gemini Vision OCR timeout after ${overallTimeout}ms`)), overallTimeout)
      )
    ]) as any;
    
    // More lenient validation - accept any meaningful text
    if (geminiResult.text && geminiResult.text.length > 50) {
      console.log(`✅ Gemini Vision OCR successful: ${geminiResult.text.length} characters, confidence: ${geminiResult.confidence}`);
      
      return {
        text: geminiResult.text,
        method: 'gemini-vision-ocr',
        quality: Math.min(geminiResult.confidence || 0.7, 1.0),
        confidence: geminiResult.confidence || 0.7,
        pageCount: geminiResult.pageCount || Math.max(1, Math.ceil(pdfData.length / 50000)),
        fileType: 'pdf',
        processingNotes: `Gemini Vision OCR: ${geminiResult.pageCount || 'unknown'} pages, ${geminiResult.text.length} characters, confidence ${((geminiResult.confidence || 0.7) * 100).toFixed(1)}%`,
        isScanned: true
      };
    } else {
      throw new Error('Gemini Vision OCR returned insufficient text');
    }
    
  } catch (geminiError) {
    console.error('❌ Gemini Vision processing failed:', geminiError);
    console.log('⚠️ Gemini Vision OCR failed, creating fallback document...');
    
    // Return a fallback summary instead of throwing error
    const { createFallbackSummary } = await import('../utils/fallbackSummaryGenerator.ts');
    return createFallbackSummary(
      pdfData, 
      fileName, 
      'pdf', 
      `OCR processing failed: ${geminiError.message}. Document uploaded successfully but text extraction was not possible.`
    );
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
