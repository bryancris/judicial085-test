// Real OCR Service for Scanned Documents using OpenAI Vision API
import { extractTextWithOpenAIVision } from './openaiVisionService.ts';

export async function extractTextWithWorkingOCR(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
}> {
  console.log('🔍 Starting real OCR extraction using OpenAI Vision API...');
  
  try {
    // Use OpenAI Vision API for real OCR processing
    console.log('📄 Calling OpenAI Vision API for OCR extraction...');
    console.log(`PDF data size: ${pdfData.length} bytes`);
    
    const visionResult = await extractTextWithOpenAIVision(pdfData);
    
    console.log(`✅ Vision API extraction completed: ${visionResult.text.length} characters, confidence: ${visionResult.confidence}`);
    console.log(`Vision API text sample: "${visionResult.text.substring(0, 200)}..."`);
    
    // Validate the OCR result
    const validation = validateOCRResult(visionResult.text, visionResult.confidence);
    console.log(`OCR validation result: valid=${validation.isValid}, quality=${validation.quality}, needsReview=${validation.needsManualReview}`);
    
    if (validation.isValid) {
      console.log('✅ OCR result passed validation, returning extracted text');
      return {
        text: visionResult.text,
        confidence: validation.quality
      };
    } else {
      console.log('⚠️ OCR result failed validation, creating fallback...');
      console.log(`Validation failure reasons: quality too low, contains metadata, or other issues`);
      return createMinimalFallback(pdfData, 'OCR validation failed - extracted content appears to be metadata or corrupted');
    }
    
  } catch (error) {
    console.error('❌ OCR processing failed with error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return createMinimalFallback(pdfData, `OCR failed: ${error.message}`);
  }
}

// ENHANCED metadata detection - same as real extractor but for OCR
function isMetadataContent(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // FIRST: Check for legal content
  const legalTerms = [
    'REQUEST FOR PRODUCTION',
    'DISCOVERY',
    'INTERROGATORY',
    'DEFENDANT',
    'PLAINTIFF',
    'COURT',
    'CASE NO',
    'MOTION'
  ];
  
  const hasLegalContent = legalTerms.some(term => 
    text.toUpperCase().includes(term)
  );
  
  if (hasLegalContent) {
    console.log('✅ OCR: Legal content detected, NOT metadata');
    return false;
  }
  
  // Enhanced patterns to catch garbage
  const metadataPatterns = [
    /^PDF\s+[A-Z]{2,3}\s+[A-Z]{2,3}/i,          // "PDF XWX JP HU..." pattern
    /^[A-Z]{2,4}(\s+[A-Z]{2,4}){8,}/,            // Multiple short uppercase abbreviations (increased threshold)
    /^[A-Za-z]{1,3}\^\w/,                        // Patterns like "Fh^f"
    /rdf:|xml:|dc:/i,                            // RDF/XML namespace prefixes
    /begin=|end=/,                               // PDF structure markers
    /Core\s+rdf/i,                               // PDF metadata structures
    /Producer\s+PDF/i,                           // PDF producer info
    /W5M0MpCehiHzreSzNTczkc9d/i,                // Specific metadata IDs
    /xmlns|xmp:|adobe/i,                         // XML/Adobe metadata
    /PDFlib\+PDI/i,                              // PDF library markers
    /^[^\w\s]*[A-Za-z]{1,4}\^[^\w\s]*\w/,       // Encoded metadata patterns
    /alt\s+rdf:li/i,                             // RDF list items
    /^[\s\w\^\~\<\>]{20,}begin=/i                // Mixed garbage with begin markers
  ];
  
  const hasMetadataPattern = metadataPatterns.some(pattern => pattern.test(text));
  
  if (hasMetadataPattern) {
    console.log('❌ OCR detected PDF metadata content, rejecting');
    return true;
  }
  
  // LESS AGGRESSIVE: Check for compression artifacts
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const shortWords = words.filter(word => word.length <= 3).length;
  const abbreviationRatio = words.length > 0 ? shortWords / words.length : 0;
  
  if (abbreviationRatio > 0.85) { // Increased threshold
    console.log('❌ OCR detected high abbreviation ratio, likely compression artifacts');
    return true;
  }
  
  // Check for specific garbage patterns
  if (text.includes("PDF XWX") || /^[A-Z\s]{30,}$/.test(text.trim())) {
    console.log('❌ OCR detected PDF compression artifacts');
    return true;
  }
  
  return false;
}

// Enhanced OCR processing for large documents
export async function processLargeDocument(pdfData: Uint8Array, maxPages: number = 50): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
  processingNotes?: string;
}> {
  console.log(`🔍 Processing large document with max ${maxPages} pages...`);
  
  try {
    // Check document size and estimate page count
    const estimatedPages = Math.ceil(pdfData.length / 50000); // Rough estimate: 50KB per page
    console.log(`Estimated pages: ${estimatedPages}`);
    
    if (estimatedPages <= maxPages) {
      // Process all pages normally
      const result = await extractTextWithOpenAIVision(pdfData);
      return {
        text: result.text,
        confidence: result.confidence,
        pageCount: result.pageCount,
        processingNotes: `Processed all ${result.pageCount || estimatedPages} pages`
      };
    } else {
      // For very large documents, process a sample of pages
      console.log(`⚠️ Large document detected (${estimatedPages} estimated pages). Processing sample...`);
      
      try {
        // Try to process first portion of the document
        const sampleSize = Math.min(pdfData.length * 0.3, 2 * 1024 * 1024); // 30% or 2MB max
        const sampleData = pdfData.slice(0, sampleSize);
        
        const result = await extractTextWithOpenAIVision(sampleData);
        
        return {
          text: result.text + `\n\n[Note: This is a large document (${estimatedPages}+ pages). Only a sample was processed via OCR. Upload smaller sections for complete extraction.]`,
          confidence: result.confidence * 0.7, // Reduce confidence for partial processing
          pageCount: estimatedPages,
          processingNotes: `Large document: Processed sample of estimated ${estimatedPages} pages`
        };
        
      } catch (sampleError) {
        console.error('❌ Sample processing failed:', sampleError);
        return createMinimalFallback(pdfData, `Large document processing failed: ${sampleError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Large document processing failed:', error);
    return createMinimalFallback(pdfData, `Large document processing error: ${error.message}`);
  }
}

// Create minimal fallback with enhanced information
function createMinimalFallback(pdfData: Uint8Array, reason: string): {
  text: string;
  confidence: number;
} {
  const size = pdfData.length;
  const sizeKB = Math.round(size / 1024);
  const sizeMB = (size / (1024 * 1024)).toFixed(1);
  const currentDate = new Date().toISOString().split('T')[0];
  const estimatedPages = Math.ceil(size / 50000);
  
  const fallbackText = `SCANNED DOCUMENT - OCR PROCESSING ATTEMPTED
Date Processed: ${currentDate}
File Size: ${sizeKB}KB (${sizeMB}MB)
Estimated Pages: ${estimatedPages}
Processing Method: OpenAI Vision OCR
Processing Status: ${reason}

DOCUMENT INFORMATION:
This appears to be a scanned PDF document that was processed using advanced OCR technology.

PROCESSING NOTES:
- Document has been uploaded and stored successfully
- OCR extraction was attempted but encountered limitations
- File is available for manual review and download
- Document can be referenced in AI legal discussions

RECOMMENDED ACTIONS:
1. Review the original document manually for critical content
2. Consider splitting large documents into smaller sections for better OCR results  
3. Ensure document quality is sufficient for OCR processing
4. Use this document in legal AI conversations for case analysis

This document is now part of your legal case management system and available for analysis.`;

  return {
    text: fallbackText,
    confidence: 0.3
  };
}

// ENHANCED OCR validation - less aggressive for legal documents
export function validateOCRResult(text: string, confidence: number): {
  isValid: boolean;
  quality: number;
  needsManualReview: boolean;
} {
  // FIRST: Check for legal content
  const legalTerms = ['REQUEST', 'DISCOVERY', 'COURT', 'CASE', 'DEFENDANT', 'PLAINTIFF'];
  const hasLegalContent = legalTerms.some(term => 
    text.toUpperCase().includes(term)
  );
  
  if (hasLegalContent) {
    console.log('✅ OCR validation: Legal content detected, accepting');
    return {
      isValid: true,
      quality: Math.max(confidence, 0.6),
      needsManualReview: confidence < 0.7
    };
  }
  
  // THEN: Check for garbage
  if (text.includes("PDF XWX") || /^[A-Z\s]{30,}$/.test(text.trim())) {
    console.log('❌ OCR validation failed: compression artifacts detected');
    return {
      isValid: false,
      quality: 0,
      needsManualReview: true
    };
  }
  
  // Check for metadata first
  if (isMetadataContent(text)) {
    console.log('❌ OCR validation failed: metadata detected');
    return {
      isValid: false,
      quality: 0,
      needsManualReview: true
    };
  }
  
  // ENHANCED: Check abbreviation ratio with higher threshold
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const shortWords = words.filter(word => word.length <= 3).length;
  const abbreviationRatio = words.length > 0 ? shortWords / words.length : 0;
  
  if (abbreviationRatio > 0.85) { // Increased threshold
    console.log(`❌ OCR validation failed: too many abbreviations (${abbreviationRatio})`);
    return {
      isValid: false,
      quality: 0,
      needsManualReview: true
    };
  }
  
  const isValid = confidence > 0.15 && text.length > 30; // More lenient thresholds
  const quality = confidence;
  const needsManualReview = confidence < 0.6 || text.length < 200;
  
  return {
    isValid,
    quality,
    needsManualReview
  };
}
