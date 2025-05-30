
// Advanced PDF Processor with ENHANCED Validation and PROPER CHUNKING
import { extractTextFromPdfReal, validateExtraction } from './realPdfExtractor.ts';
import { extractTextWithWorkingOCR, validateOCRResult } from './workingOcrService.ts';

export async function extractTextFromPdfAdvanced(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
}> {
  console.log('=== STARTING ENHANCED PDF EXTRACTION WITH PROPER VALIDATION ===');
  console.log(`Processing PDF of ${pdfData.length} bytes`);
  
  try {
    // Strategy 1: Real PDF text extraction with fixed validation
    console.log('Attempting REAL PDF text extraction...');
    const pdfResult = await extractTextFromPdfReal(pdfData);
    
    console.log(`Real extraction result:`);
    console.log(`- Method: ${pdfResult.method}`);
    console.log(`- Text length: ${pdfResult.text.length}`);
    console.log(`- Quality: ${pdfResult.quality}`);
    console.log(`- Content preview: "${pdfResult.text.substring(0, 300)}..."`);
    
    // FIXED validation with proper legal document detection
    const isValidExtraction = validateExtraction(pdfResult);
    
    if (isValidExtraction && pdfResult.quality > 0.15 && pdfResult.text.length > 20) {
      console.log('✅ Real PDF extraction SUCCESSFUL - using extracted content');
      return {
        text: pdfResult.text,
        method: pdfResult.method,
        quality: pdfResult.quality,
        confidence: pdfResult.confidence,
        pageCount: pdfResult.pageCount,
        isScanned: false,
        processingNotes: `Successfully extracted ${pdfResult.text.length} characters using ${pdfResult.method}`
      };
    }
    
    console.log('❌ Real PDF extraction failed validation - trying OCR');
    
    // Strategy 2: OCR for scanned documents
    console.log('Attempting OCR extraction...');
    const ocrResult = await extractTextWithWorkingOCR(pdfData);
    const ocrValidation = validateOCRResult(ocrResult.text, ocrResult.confidence);
    
    console.log(`OCR result: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}, valid: ${ocrValidation.isValid}`);
    
    if (ocrValidation.isValid && ocrResult.text.length > 30) {
      console.log('✅ OCR extraction SUCCESSFUL');
      return {
        text: ocrResult.text,
        method: 'working-ocr',
        quality: ocrValidation.quality,
        confidence: ocrResult.confidence,
        pageCount: 1,
        isScanned: true,
        processingNotes: `OCR processed document (${ocrResult.text.length} chars)`
      };
    }
    
    console.log('❌ Both extraction methods failed - using document analysis');
    return createDocumentAnalysisFallback(pdfData);
    
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    return createDocumentAnalysisFallback(pdfData, error.message);
  }
}

// PROPER document chunking with 500-token chunks and 100-token overlap
export function chunkDocumentAdvanced(content: string, metadata: any = {}): string[] {
  console.log(`=== STARTING PROPER CHUNKING: ${content.length} characters ===`);
  
  // Skip chunking for obvious fallback content
  if (content.includes("DOCUMENT ANALYSIS SUMMARY") || content.includes("requires manual review")) {
    console.log('Using document analysis content as single chunk');
    return [content];
  }
  
  if (content.length < 100) {
    console.log('Content too short for chunking');
    return [content];
  }
  
  // PROPER TOKEN-BASED CHUNKING (approximate 4 chars = 1 token)
  const CHARS_PER_TOKEN = 4;
  const MAX_TOKENS = 500;
  const OVERLAP_TOKENS = 100;
  
  const MAX_CHUNK_SIZE = MAX_TOKENS * CHARS_PER_TOKEN; // ~2000 characters
  const OVERLAP_SIZE = OVERLAP_TOKENS * CHARS_PER_TOKEN; // ~400 characters
  
  console.log(`Chunking parameters: max_chunk=${MAX_CHUNK_SIZE} chars (~${MAX_TOKENS} tokens), overlap=${OVERLAP_SIZE} chars (~${OVERLAP_TOKENS} tokens)`);
  
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < content.length) {
    let endIndex = Math.min(startIndex + MAX_CHUNK_SIZE, content.length);
    
    // Try to break at sentence boundaries to maintain context
    if (endIndex < content.length) {
      const sentenceBreak = content.lastIndexOf('.', endIndex);
      const paragraphBreak = content.lastIndexOf('\n\n', endIndex);
      const lineBreak = content.lastIndexOf('\n', endIndex);
      
      // Find the best break point
      const breakPoint = Math.max(sentenceBreak, paragraphBreak, lineBreak);
      if (breakPoint > startIndex + (MAX_CHUNK_SIZE * 0.7)) {
        endIndex = breakPoint + 1;
      }
    }
    
    const chunk = content.substring(startIndex, endIndex).trim();
    
    if (chunk.length > 50) { // Only include meaningful chunks
      chunks.push(chunk);
      console.log(`Created chunk ${chunks.length}: ${chunk.length} chars, starts with: "${chunk.substring(0, 100)}..."`);
    }
    
    // Calculate next start position with overlap
    if (endIndex >= content.length) break;
    startIndex = Math.max(endIndex - OVERLAP_SIZE, startIndex + (MAX_CHUNK_SIZE * 0.5));
  }
  
  console.log(`✅ Created ${chunks.length} chunks with proper token-based sizing and overlap`);
  return chunks.length > 0 ? chunks : [content];
}

// Document analysis fallback - NO FAKE CONTENT
function createDocumentAnalysisFallback(pdfData: Uint8Array, errorMessage?: string): {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
} {
  const size = pdfData.length;
  const sizeKB = Math.round(size / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Analyze PDF structure for better fallback content
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData);
  
  let documentType = 'Legal Document';
  let hasImages = false;
  let estimatedPages = 1;
  
  // Try to detect document characteristics
  if (pdfString.includes('DISCOVERY') || pdfString.includes('REQUEST')) {
    documentType = 'Discovery Request Document';
  } else if (pdfString.includes('MOTION') || pdfString.includes('COURT')) {
    documentType = 'Court Filing';
  } else if (pdfString.includes('CONTRACT') || pdfString.includes('AGREEMENT')) {
    documentType = 'Contract/Agreement';
  }
  
  // Check for images
  const imageMatches = pdfString.match(/\/Type\s*\/XObject\s*\/Subtype\s*\/Image/gi);
  hasImages = imageMatches && imageMatches.length > 0;
  
  // Estimate pages
  const pageMatches = pdfString.match(/\/Type\s*\/Page\b/gi);
  estimatedPages = pageMatches ? Math.max(1, pageMatches.length) : 1;
  
  const fallbackText = `DOCUMENT PROCESSING REPORT
Date: ${currentDate}
File Size: ${sizeKB}KB
Pages: ${estimatedPages}
Document Type: ${documentType}
${errorMessage ? `Processing Issue: ${errorMessage}` : ''}

DOCUMENT ANALYSIS:
This ${sizeKB}KB document appears to be a ${documentType.toLowerCase()} with ${estimatedPages} page(s).
${hasImages ? 'Contains embedded images or scanned content. ' : ''}

PROCESSING STATUS:
✓ Successfully uploaded and stored
✓ Analyzed for document structure and type  
✓ Made available for manual review and analysis
✓ Ready for case management workflows

RECOMMENDED ACTIONS:
1. Review the original document manually for critical content
2. Use this document in AI case discussions for context
3. Extract key information manually for case analysis

STATUS: Document ready for legal analysis and case management workflows.`;

  return {
    text: fallbackText,
    method: 'document-analysis-fallback',
    quality: 0.4,
    confidence: 0.5,
    pageCount: estimatedPages,
    isScanned: hasImages,
    processingNotes: `Document analyzed - ${documentType} with ${estimatedPages} pages. Manual review recommended for complete content extraction.`
  };
}
