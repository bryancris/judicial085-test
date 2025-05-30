import { extractTextWithLibrary, validateLibraryExtraction } from './pdfLibraryService.ts';
import { extractTextWithOCR, validateOCRExtraction } from './ocrService.ts';

// Advanced PDF processing with multiple extraction strategies
export async function extractTextFromPdfAdvanced(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
}> {
  console.log('Starting advanced PDF text extraction with multiple strategies...');
  
  const extractionResults: Array<{
    method: string;
    text: string;
    quality: number;
    confidence: number;
    pageCount: number;
    isValid: boolean;
    issues: string[];
  }> = [];
  
  // Strategy 1: Library-based extraction (for digital PDFs)
  try {
    console.log('Attempting library-based extraction...');
    const libraryResult = await extractTextWithLibrary(pdfData);
    const validation = validateLibraryExtraction(libraryResult.text, libraryResult.pageCount);
    
    extractionResults.push({
      method: 'library',
      text: libraryResult.text,
      quality: validation.quality,
      confidence: validation.isValid ? 0.9 : 0.4,
      pageCount: libraryResult.pageCount,
      isValid: validation.isValid,
      issues: validation.issues
    });
    
    console.log(`Library extraction: ${libraryResult.text.length} chars, quality: ${validation.quality}, valid: ${validation.isValid}`);
    
  } catch (error) {
    console.warn('Library-based extraction failed:', error);
    extractionResults.push({
      method: 'library',
      text: '',
      quality: 0,
      confidence: 0,
      pageCount: 0,
      isValid: false,
      issues: [`Library extraction failed: ${error.message}`]
    });
  }
  
  // Strategy 2: OCR-based extraction (for scanned PDFs)
  try {
    console.log('Attempting OCR-based extraction...');
    const ocrResult = await extractTextWithOCR(pdfData);
    const validation = validateOCRExtraction(ocrResult.text, ocrResult.confidence);
    
    extractionResults.push({
      method: 'ocr',
      text: ocrResult.text,
      quality: validation.quality,
      confidence: ocrResult.confidence,
      pageCount: 1, // OCR typically processes as single document
      isValid: validation.isValid,
      issues: validation.needsManualReview ? ['OCR confidence low, may need manual review'] : []
    });
    
    console.log(`OCR extraction: ${ocrResult.text.length} chars, confidence: ${ocrResult.confidence}, valid: ${validation.isValid}`);
    
  } catch (error) {
    console.warn('OCR-based extraction failed:', error);
    extractionResults.push({
      method: 'ocr',
      text: '',
      quality: 0,
      confidence: 0,
      pageCount: 0,
      isValid: false,
      issues: [`OCR extraction failed: ${error.message}`]
    });
  }
  
  // Select the best extraction result
  const bestResult = selectBestExtractionResult(extractionResults);
  
  // If no good results, create intelligent fallback
  if (!bestResult.isValid) {
    const fallbackResult = createIntelligentFallback(pdfData, extractionResults);
    return fallbackResult;
  }
  
  // Determine if document is likely scanned
  const isScanned = bestResult.method === 'ocr' || 
                   (bestResult.method === 'library' && bestResult.quality < 0.6);
  
  const processingNotes = createProcessingNotes(bestResult, extractionResults);
  
  console.log(`Advanced extraction completed: method=${bestResult.method}, quality=${bestResult.quality}, confidence=${bestResult.confidence}`);
  
  return {
    text: bestResult.text,
    method: bestResult.method,
    quality: bestResult.quality,
    confidence: bestResult.confidence,
    pageCount: bestResult.pageCount,
    isScanned: isScanned,
    processingNotes: processingNotes
  };
}

// Select the best extraction result based on quality and confidence
function selectBestExtractionResult(results: Array<{
  method: string;
  text: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isValid: boolean;
  issues: string[];
}>): any {
  
  // Filter valid results
  const validResults = results.filter(r => r.isValid && r.text.length > 50);
  
  if (validResults.length === 0) {
    // Return the best invalid result for fallback processing
    return results.reduce((best, current) => 
      (current.quality * current.confidence) > (best.quality * best.confidence) ? current : best
    );
  }
  
  // Score results by combining quality and confidence
  const scoredResults = validResults.map(result => ({
    ...result,
    score: (result.quality * 0.6) + (result.confidence * 0.4)
  }));
  
  // Return the highest scoring result
  return scoredResults.reduce((best, current) => 
    current.score > best.score ? current : best
  );
}

// Create intelligent fallback when extraction fails
function createIntelligentFallback(pdfData: Uint8Array, results: Array<any>): {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
} {
  console.log('Creating intelligent fallback for failed extraction...');
  
  const size = pdfData.length;
  const sizeKB = Math.round(size / 1024);
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Try to get any partial text from failed attempts
  const partialTexts = results
    .filter(r => r.text && r.text.length > 10)
    .map(r => r.text);
  
  let fallbackText = '';
  
  if (partialTexts.length > 0) {
    // Combine and clean partial extractions
    fallbackText = `Partial Content Extracted:

${partialTexts.join('\n\n---\n\n')}

Note: This document required advanced processing. Some content may be incomplete.`;
  } else {
    // Create structured document info
    fallbackText = `Document Processing Summary

File Information:
- Size: ${sizeKB}KB
- Upload Date: ${currentDate}
- Processing Status: Requires specialized extraction

Document Analysis:
This PDF document could not be processed using standard text extraction methods. This typically indicates:

1. Scanned Document: The PDF contains images of text rather than digital text
2. Complex Layout: The document has a complex structure requiring specialized processing
3. Protected Content: The document may have restrictions on text extraction
4. Corrupted Data: The file may have formatting issues

Recommended Actions:
- Manual review of the document content
- Use of specialized OCR tools for scanned documents
- Conversion to a different format if possible

The document is stored and available for download and manual analysis.`;
  }
  
  const processingNotes = `Advanced extraction failed. Attempted methods: ${results.map(r => r.method).join(', ')}. Issues: ${results.flatMap(r => r.issues).join('; ')}`;
  
  return {
    text: fallbackText,
    method: 'intelligent-fallback',
    quality: 0.3,
    confidence: 0.2,
    pageCount: 1,
    isScanned: true,
    processingNotes: processingNotes
  };
}

// Create processing notes for successful extractions
function createProcessingNotes(bestResult: any, allResults: Array<any>): string {
  const notes: string[] = [];
  
  notes.push(`Successfully extracted using ${bestResult.method} method`);
  notes.push(`Quality score: ${bestResult.quality.toFixed(2)}`);
  notes.push(`Confidence: ${bestResult.confidence.toFixed(2)}`);
  
  if (bestResult.pageCount > 1) {
    notes.push(`Multi-page document (${bestResult.pageCount} pages)`);
  }
  
  if (bestResult.issues && bestResult.issues.length > 0) {
    notes.push(`Warnings: ${bestResult.issues.join(', ')}`);
  }
  
  // Add information about other attempted methods
  const otherMethods = allResults.filter(r => r.method !== bestResult.method);
  if (otherMethods.length > 0) {
    const methodStatus = otherMethods.map(r => 
      `${r.method}: ${r.isValid ? 'succeeded' : 'failed'}`
    ).join(', ');
    notes.push(`Other methods tested: ${methodStatus}`);
  }
  
  return notes.join('. ');
}

// Enhanced document chunking with content-aware splitting
export function chunkDocumentAdvanced(content: string, metadata: any = {}): string[] {
  console.log(`Starting advanced chunking for ${content.length} characters`);
  
  if (content.length < 100) {
    console.log('Content too short for chunking, returning as single chunk');
    return [content];
  }
  
  const MAX_CHUNK_SIZE = 1500;
  
  // Detect content type for specialized chunking
  const contentType = detectAdvancedContentType(content);
  
  console.log(`Detected content type: ${contentType}`);
  
  switch (contentType) {
    case 'email':
      return chunkEmailContentAdvanced(content, MAX_CHUNK_SIZE);
    case 'legal_document':
      return chunkLegalDocumentAdvanced(content, MAX_CHUNK_SIZE);
    case 'form':
      return chunkFormContentAdvanced(content, MAX_CHUNK_SIZE);
    case 'structured':
      return chunkStructuredContentAdvanced(content, MAX_CHUNK_SIZE);
    default:
      return chunkGenericContentAdvanced(content, MAX_CHUNK_SIZE);
  }
}

// Detect content type with advanced analysis
function detectAdvancedContentType(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Email detection
  if (/^(from|to|subject|date):/m.test(content) || 
      content.includes('@') && /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
    return 'email';
  }
  
  // Legal document detection
  if (/\b(whereas|party|agreement|contract|shall|thereof|heretofore|jurisdiction)\b/i.test(content)) {
    return 'legal_document';
  }
  
  // Form detection
  if (/^[A-Z][^.]*:/.test(content) || content.includes('___') || /\[\s*\]/.test(content)) {
    return 'form';
  }
  
  // Structured content detection
  if (/^\d+\./.test(content) || /^[A-Z]\)/.test(content) || content.includes('Section ')) {
    return 'structured';
  }
  
  return 'generic';
}

// Advanced email content chunking
function chunkEmailContentAdvanced(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  const sections = content.split(/\n\s*\n/);
  
  let currentChunk = '';
  let headerSection = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // Identify and preserve email headers
    if (/^(From|To|Subject|Date|Sent|Cc|Bcc):/i.test(trimmed)) {
      headerSection += (headerSection ? '\n' : '') + trimmed;
      continue;
    }
    
    // Start first chunk with headers if we have them
    if (headerSection && !currentChunk) {
      currentChunk = headerSection + '\n\n';
      headerSection = '';
    }
    
    // Add section to current chunk or start new one
    if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 200) {
      chunks.push(currentChunk.trim());
      currentChunk = headerSection ? headerSection + '\n\n' + trimmed : trimmed;
    } else {
      currentChunk += (currentChunk && !currentChunk.endsWith('\n\n') ? '\n\n' : '') + trimmed;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// Advanced legal document chunking
function chunkLegalDocumentAdvanced(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  
  // Split by sections or paragraphs
  const sections = content.split(/\n\s*\n|\n(?=\d+\.|\b(?:Section|Article|Clause)\b)/);
  
  let currentChunk = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 300) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// Advanced form content chunking
function chunkFormContentAdvanced(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  const lines = content.split('\n');
  
  let currentChunk = '';
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Detect form field labels
    if (/^[A-Z][^:]*:/.test(trimmed) || trimmed.includes('___')) {
      if (currentSection && currentChunk.length + currentSection.length > maxSize) {
        chunks.push(currentChunk.trim());
        currentChunk = currentSection;
        currentSection = '';
      }
      currentSection += (currentSection ? '\n' : '') + trimmed;
    } else {
      currentSection += (currentSection ? '\n' : '') + trimmed;
    }
    
    if (currentSection.length > maxSize) {
      currentChunk += (currentChunk ? '\n' : '') + currentSection;
      currentSection = '';
    }
  }
  
  if (currentSection) {
    currentChunk += (currentChunk ? '\n' : '') + currentSection;
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// Advanced structured content chunking
function chunkStructuredContentAdvanced(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  
  // Split by numbered sections or bullet points
  const sections = content.split(/\n(?=\d+\.|\n[A-Z]\)|\n•|\n-\s)/);
  
  let currentChunk = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 200) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + trimmed;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

// Advanced generic content chunking
function chunkGenericContentAdvanced(content: string, maxSize: number): string[] {
  const chunks: string[] = [];
  
  // Try paragraph-based chunking first
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length > 1) {
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      
      if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 300) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  } else {
    // Fallback to sentence-based chunking
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
    
    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmed = sentence.trim() + '.';
      
      if (currentChunk.length + trimmed.length > maxSize && currentChunk.length > 300) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }
  
  const validChunks = chunks.filter(chunk => chunk.length > 30);
  
  if (validChunks.length === 0) {
    console.warn('No valid chunks created, returning original content');
    return [content];
  }
  
  console.log(`Advanced chunking completed: ${validChunks.length} chunks created`);
  return validChunks;
}
