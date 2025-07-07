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
    
  // Log raw OCR result for debugging
  console.log(`Raw OCR result (first 500 chars): "${visionResult.text.substring(0, 500)}"`);
  
  // Only check for extreme corruption, not normal scanned document artifacts
  if (visionResult.text.length < 20) {
    console.log('⚠️ OCR result too short, creating fallback...');
    return createMinimalFallback(pdfData, 'OCR result too short');
  }
    
  // Clean the OCR text and return it
  const cleanedText = cleanOCRText(visionResult.text);
  console.log(`✅ OCR extraction successful: ${cleanedText.length} characters`);
  console.log(`Cleaned text sample: "${cleanedText.substring(0, 200)}..."`);
  
  return {
    text: cleanedText,
    confidence: visionResult.confidence
  };
    
  } catch (error) {
    console.error('❌ OCR processing failed with error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return createMinimalFallback(pdfData, `OCR failed: ${error.message}`);
  }
}

// Simple text cleaning for OCR results - clean instead of reject
function cleanOCRText(text: string): string {
  if (!text) return text;
  
  // Remove excessive whitespace but preserve line breaks
  let cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  
  // Fix common OCR errors but don't be too aggressive
  cleaned = cleaned.replace(/\s+([,.;:])/g, '$1'); // Fix spacing before punctuation
  cleaned = cleaned.replace(/([.!?])\s*([a-z])/g, '$1 $2'); // Fix sentence spacing
  
  return cleaned.trim();
}

// Much less aggressive metadata detection for OCR
function isMetadataContent(text: string): boolean {
  if (!text || text.length < 10) return false;
  
  // FIRST: Greatly expanded legal content check - accept ANY legal document content
  const legalTerms = [
    'REQUEST FOR PRODUCTION', 'DISCOVERY', 'INTERROGATORY', 'DEFENDANT', 'PLAINTIFF',
    'COURT', 'CASE NO', 'MOTION', 'LEASE', 'LEASING', 'TENANT', 'LANDLORD',
    'AGREEMENT', 'CONTRACT', 'GUIDELINES', 'POLICY', 'NOTICE', 'DEMAND',
    'ATTORNEY', 'LAW', 'LEGAL', 'PETITION', 'COMPLAINT', 'ANSWER',
    'PROPERTY', 'PREMISES', 'RENT', 'RENTAL', 'RULES', 'REGULATIONS',
    'TERMS', 'CONDITIONS', 'LIABILITY', 'DAMAGES', 'VIOLATION'
  ];
  
  const hasLegalContent = legalTerms.some(term => 
    text.toUpperCase().includes(term)
  );
  
  if (hasLegalContent) {
    console.log(`✅ OCR: Legal content detected (${legalTerms.find(term => text.toUpperCase().includes(term))}), NOT metadata`);
    return false;
  }
  
  // Much more aggressive check - only reject truly obvious garbage
  const obviousGarbagePatterns = [
    /^PDF\s+XWX/i,                              // Known garbage pattern
    /^[A-Z]{2,4}(\s+[A-Z]{2,4}){15,}/,         // Many short uppercase abbreviations (increased threshold)
    /W5M0MpCehiHzreSzNTczkc9d/i,               // Specific metadata IDs
    /xmlns.*rdf.*adobe/i,                       // Clear XML/Adobe metadata
    /^[^\w\s]*[A-Za-z]{1,2}\^[^\w\s]*$/        // Encoded patterns with no readable content
  ];
  
  const hasObviousGarbage = obviousGarbagePatterns.some(pattern => pattern.test(text));
  
  if (hasObviousGarbage) {
    console.log('❌ OCR detected obvious garbage/metadata, rejecting');
    return true;
  }
  
  // Much more lenient compression artifact check
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const shortWords = words.filter(word => word.length <= 2).length; // Only count very short words
  const abbreviationRatio = words.length > 0 ? shortWords / words.length : 0;
  
  // Only reject if almost all content is tiny abbreviations
  if (abbreviationRatio > 0.95 && words.length > 20) {
    console.log('❌ OCR detected extreme abbreviation ratio, likely compression artifacts');
    return true;
  }
  
  // Accept almost everything else
  console.log('✅ OCR content passed lenient validation');
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

// Much more lenient OCR validation using improved metadata detection
export function validateOCRResult(text: string, confidence: number): {
  isValid: boolean;
  quality: number;
  needsManualReview: boolean;
} {
  // Accept almost any readable text from OCR
  const hasReadableContent = text.length > 5 && (text.match(/[a-zA-Z]/) !== null);
  
  // Use the improved metadata detection function
  const isMetadata = isMetadataContent(text);
  
  if (isMetadata) {
    console.log('❌ OCR validation: Content identified as metadata, rejecting');
    return {
      isValid: false,
      quality: 0,
      needsManualReview: true
    };
  }
  
  // Greatly expanded legal content check with boost
  const legalTerms = [
    'REQUEST', 'DISCOVERY', 'COURT', 'CASE', 'DEFENDANT', 'PLAINTIFF', 'ATTORNEY', 'LAW',
    'LEASE', 'LEASING', 'TENANT', 'LANDLORD', 'AGREEMENT', 'CONTRACT', 'GUIDELINES', 
    'POLICY', 'NOTICE', 'DEMAND', 'PROPERTY', 'PREMISES', 'RENT', 'RENTAL', 'RULES', 
    'REGULATIONS', 'TERMS', 'CONDITIONS', 'LIABILITY', 'DAMAGES', 'VIOLATION'
  ];
  
  const hasLegalContent = legalTerms.some(term => 
    text.toUpperCase().includes(term)
  );
  
  if (hasLegalContent) {
    console.log('✅ OCR validation: Legal content detected, accepting with high quality');
    return {
      isValid: true,
      quality: Math.max(confidence, 0.8), // Higher boost for legal content
      needsManualReview: false
    };
  }
  
  // Accept almost everything else that has basic readability
  const isValid = hasReadableContent && confidence > 0.01; // Extremely low threshold
  const quality = Math.max(confidence, 0.5); // Boost quality for any extracted text
  const needsManualReview = confidence < 0.2; // Lower threshold for manual review
  
  console.log(`Very lenient OCR validation: isValid=${isValid}, quality=${quality.toFixed(2)}, text length=${text.length}, confidence=${confidence.toFixed(2)}`);
  
  return {
    isValid,
    quality,
    needsManualReview
  };
}
