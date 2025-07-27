
/**
 * ====================================================================
 * PDF DOCUMENT PROCESSOR - WRAPPER FOR PDF-PARSE EXTRACTION
 * ====================================================================
 * 
 * This processor acts as a wrapper around the pdf-parse extraction service,
 * providing consistent interface and error handling for the unified document
 * processor.
 * 
 * RESPONSIBILITIES:
 * - Calls pdf-parse extraction service
 * - Validates extraction results
 * - Converts results to standard DocumentExtractionResult format
 * - Handles errors gracefully with detailed logging
 * 
 * This is Step 1 in the 3-tier processing strategy.
 */

import { extractTextWithPdfParse, validatePdfParseExtraction } from '../services/pdfParseExtractionService.ts';
import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

/**
 * PROCESS PDF DOCUMENT USING PDF-PARSE
 * 
 * Main entry point for standard PDF text extraction. This function:
 * 1. Calls the pdf-parse extraction service
 * 2. Validates the extraction results (leniently for legal documents)
 * 3. Converts to standard DocumentExtractionResult format
 * 4. Provides detailed processing notes for debugging
 * 
 * VALIDATION STRATEGY:
 * - Uses lenient validation suitable for legal documents
 * - Only rejects completely failed extractions
 * - Continues with borderline cases that might be valid
 * - Logs validation issues but doesn't fail unless critical
 * 
 * @param pdfData - Raw PDF file bytes
 * @param fileName - Original filename for logging
 * @returns DocumentExtractionResult with text and metadata
 * @throws Error if extraction completely fails or produces no readable text
 */
export async function processPdfDocument(pdfData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing PDF document with pdf-parse (Step 1 of processing strategy)...');
  
  try {
    // Call low-level pdf-parse extraction
    const result = await extractTextWithPdfParse(pdfData);
    
    console.log(`✅ pdf-parse extraction completed: ${result.text.length} characters from ${result.pageCount} pages`);
    
    // Validate extraction results (lenient for legal documents)
    const validation = validatePdfParseExtraction(result.text, result.pageCount);
    
    if (!validation.isValid) {
      console.warn(`PDF extraction validation issues: ${validation.issues.join(', ')}`);
      // Continue anyway unless text is completely corrupted
      if (result.text.length < 5) {
        throw new Error(`PDF extraction completely failed: no readable text found`);
      }
    }
    
    // Convert to standard format for unified processor
    return {
      text: result.text,
      method: result.method,
      quality: result.quality,
      confidence: result.confidence,
      pageCount: result.pageCount,
      fileType: 'pdf',
      processingNotes: `pdf-parse extraction: ${result.pageCount} pages, ${result.text.length} characters, quality ${result.quality.toFixed(2)}`,
      isScanned: false // pdf-parse works on digital PDFs, not scanned
    };
    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}
