/**
 * ====================================================================
 * MISTRAL OCR SERVICE - SCANNED PDF PROCESSING
 * ====================================================================
 * 
 * This service handles OCR (Optical Character Recognition) for scanned PDFs
 * and image-based documents using Mistral's advanced AI-powered OCR API.
 * 
 * WHEN USED:
 * - Triggered when standard pdf-parse extraction fails or produces low-quality text
 * - Designed for scanned legal documents, court filings, and image-based PDFs
 * - Handles complex document layouts, multiple columns, and mixed content
 * 
 * PROCESSING STRATEGY:
 * 
 * SMART CHUNKING FOR LARGE DOCUMENTS:
 * - Documents ≤8 pages: Processed in single request for optimal accuracy
 * - Documents >8 pages: Automatically chunked into 8-page segments
 * - Each chunk processed independently to avoid API limits
 * - Results combined with clear page break markers
 * 
 * FILE LIFECYCLE:
 * 1. Upload PDF to Mistral's temporary file storage
 * 2. Determine page count for chunking strategy
 * 3. Process document in optimal chunks
 * 4. Extract and combine text from all chunks
 * 5. Calculate confidence score based on text quality
 * 6. Clean up uploaded file from Mistral storage
 * 
 * ERROR HANDLING:
 * - Graceful handling of API limits and rate limiting
 * - Automatic chunking fallback for large documents
 * - Partial processing continues even if some chunks fail
 * - Comprehensive cleanup even on failures
 */

/**
 * Base64 encoding utility for PDF upload
 * Processes large files in chunks to avoid memory issues
 */
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

export interface MistralOcrResult {
  text: string;
  confidence: number;
  pageCount?: number;
}

/**
 * UPLOAD PDF TO MISTRAL TEMPORARY STORAGE
 * 
 * Uploads the PDF file to Mistral's file storage system for OCR processing.
 * Files are automatically cleaned up after processing to avoid storage costs.
 * 
 * @param pdfData - Raw PDF bytes
 * @param mistralApiKey - Mistral API authentication key
 * @returns File ID for subsequent OCR requests
 */
async function uploadFileToMistral(pdfData: Uint8Array, mistralApiKey: string): Promise<string> {
  console.log('📤 Uploading PDF to Mistral file storage...');
  
  // Create form data for file upload
  const formData = new FormData();
  const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'document.pdf');
  formData.append('purpose', 'ocr');

  const uploadResponse = await fetch('https://api.mistral.ai/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mistralApiKey}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Mistral file upload error: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;
  
  if (!fileId) {
    throw new Error('Mistral file upload did not return a file ID');
  }

  console.log(`✅ File uploaded to Mistral with ID: ${fileId}`);
  return fileId;
}

/**
 * DETERMINE DOCUMENT PAGE COUNT FOR CHUNKING STRATEGY
 * 
 * Attempts multiple methods to determine how many pages the document contains.
 * This is crucial for deciding whether to process as single request (≤8 pages)
 * or use chunking strategy (>8 pages).
 * 
 * DETECTION METHODS:
 * 1. Check file metadata from upload response
 * 2. Make minimal OCR request to get document info
 * 3. Fallback to chunking mode if detection fails
 * 
 * @param fileId - Mistral file ID from upload
 * @param mistralApiKey - API key for authentication
 * @returns Number of pages (or high number to trigger chunking if unknown)
 */
async function getDocumentPageCount(fileId: string, mistralApiKey: string): Promise<number> {
  try {
    console.log('📄 Determining document page count for chunking strategy...');
    
    // METHOD 1: Check file metadata
    const response = await fetch('https://api.mistral.ai/v1/files', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
      },
    });

    if (response.ok) {
      const files = await response.json();
      const file = files.data?.find((f: any) => f.id === fileId) || files.find((f: any) => f.id === fileId);
      if (file?.metadata?.page_count) {
        console.log(`📄 Found page count in file metadata: ${file.metadata.page_count}`);
        return file.metadata.page_count;
      }
    }

    // METHOD 2: Minimal OCR request to get page count
    console.log('📄 Using minimal OCR request to determine page count...');
    const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        id: `page-count-${Date.now()}`,
        document: {
          type: 'file',
          file_id: fileId
        },
        pages: [1], // Just check first page
        include_image_base64: false,
        image_limit: 0,
        image_min_size: 0
        // NO document_annotation_format to avoid page limit restrictions
      }),
    });

    if (ocrResponse.ok) {
      const result = await ocrResponse.json();
      const pageCount = result.document?.page_count || result.document?.pages || 1;
      console.log(`📄 OCR request detected ${pageCount} pages`);
      return pageCount;
    } else {
      const errorText = await ocrResponse.text();
      console.warn(`⚠️ OCR page count request failed: ${ocrResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.warn('⚠️ Page count detection failed:', error);
  }
  
  // METHOD 3: Safety fallback - assume large document to trigger chunking
  console.log('⚠️ Page count detection failed, defaulting to chunking mode (assuming 16 pages)');
  return 16;
}

/**
 * PROCESS SINGLE PAGE CHUNK WITH MISTRAL OCR
 * 
 * Processes a specific range of pages (up to 8 pages) using Mistral's OCR API.
 * This function is used when documents are too large for single-request processing.
 * 
 * CHUNK PROCESSING:
 * - Processes up to 8 pages in a single API call
 * - Uses structured text extraction with JSON schema
 * - Combines text from all pages in the chunk
 * - Filters out empty or whitespace-only pages
 * 
 * @param fileId - Mistral file ID
 * @param startPage - First page to process (1-indexed)
 * @param endPage - Last page to process (inclusive)
 * @param mistralApiKey - API authentication key
 * @returns Combined text from all pages in the chunk
 */
async function processPageChunk(fileId: string, startPage: number, endPage: number, mistralApiKey: string): Promise<string> {
  console.log(`🔍 Processing pages ${startPage}-${endPage} with Mistral OCR...`);
  
  // Build page array for this chunk
  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mistralApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      id: `ocr-chunk-${startPage}-${endPage}-${Date.now()}`,
      document: {
        type: 'file',
        file_id: fileId
      },
      pages: pages,
      include_image_base64: false,
      image_limit: 0,
      image_min_size: 0,
      bbox_annotation_format: {
        type: 'text',
        json_schema: {
          name: 'text_extraction',
          schema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Extracted text content'
              }
            },
            required: ['text']
          }
        }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral OCR chunk API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Extract and combine text from all pages in this chunk
  let chunkText = '';
  if (result.pages && Array.isArray(result.pages)) {
    chunkText = result.pages
      .map((page: any) => page.text || page.markdown || '')
      .filter((text: string) => text.trim().length > 0)
      .join('\n\n');
  }

  console.log(`✅ Chunk ${startPage}-${endPage} completed: ${chunkText.length} characters`);
  return chunkText;
}

/**
 * MAIN MISTRAL OCR EXTRACTION FUNCTION
 * 
 * Orchestrates the complete OCR process from upload to cleanup.
 * Automatically chooses between single-request and chunked processing
 * based on document size.
 * 
 * PROCESSING WORKFLOW:
 * 1. Upload PDF to Mistral temporary storage
 * 2. Determine page count for processing strategy
 * 3. Choose processing method:
 *    - Single request: Documents ≤8 pages
 *    - Chunked processing: Documents >8 pages (8-page chunks)
 * 4. Extract and combine text from all processed content
 * 5. Calculate confidence score based on text quality
 * 6. Clean up uploaded file from Mistral storage
 * 
 * @param pdfData - Raw PDF file bytes
 * @returns MistralOcrResult with extracted text, confidence, and metadata
 */
export async function extractTextWithMistralOcr(pdfData: Uint8Array): Promise<MistralOcrResult> {
  console.log('🔍 Starting Mistral OCR extraction for scanned document...');
  
  const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!mistralApiKey) {
    throw new Error('Mistral API key not available');
  }

  let fileId: string | null = null;

  try {
    console.log(`📊 PDF data size: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);

    // STEP 1: Upload PDF to Mistral temporary storage
    fileId = await uploadFileToMistral(pdfData, mistralApiKey);

    // STEP 2: Determine page count for processing strategy
    const pageCount = await getDocumentPageCount(fileId, mistralApiKey);
    console.log(`📄 Document has ${pageCount} pages - choosing processing strategy...`);

    let extractedText = '';
    let totalPageCount = pageCount;

    if (pageCount <= 8) {
      // STRATEGY A: SINGLE REQUEST PROCESSING (≤8 pages)
      console.log('🔍 Using single request processing (≤8 pages)...');
      
      try {
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          id: `ocr-${Date.now()}`,
          document: {
            type: 'file',
            file_id: fileId
          },
          pages: null, // Process all pages
          include_image_base64: false,
          image_limit: 0,
          image_min_size: 0,
          bbox_annotation_format: {
            type: 'text',
            json_schema: {
              name: 'text_extraction',
              schema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Extracted text content'
                  }
                },
                required: ['text']
              }
            }
          },
          document_annotation_format: {
            type: 'text',
            json_schema: {
              name: 'document_text',
              schema: {
                type: 'object',
                properties: {
                  text: {
                    type: 'string',
                    description: 'Complete document text content'
                  }
                },
                required: ['text']
              }
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's the "too many pages" error
        if (errorText.includes('document_parser_too_many_pages') || errorText.includes('more than the maximum allowed')) {
          console.log('⚠️ Single request failed due to page limit, switching to chunking...');
          // Force chunking mode by setting a high page count
          totalPageCount = 16;
          throw new Error('SWITCH_TO_CHUNKING');
        }
        
        throw new Error(`Mistral OCR API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Extract text from OCR API response
      if (result.pages && Array.isArray(result.pages)) {
        extractedText = result.pages
          .map((page: any) => page.text || page.markdown || '')
          .filter((text: string) => text.trim().length > 0)
          .join('\n\n');
      } else if (result.text) {
        extractedText = result.text;
      } else if (result.content) {
        extractedText = result.content;
      }
      
      } catch (singleRequestError) {
        if (singleRequestError.message === 'SWITCH_TO_CHUNKING') {
          console.log('🔄 Switching to chunking mode due to page limit...');
          // Fall through to chunking logic below
        } else {
          throw singleRequestError;
        }
      }
    }
    
    if (pageCount > 8 || extractedText === '') {
      // STRATEGY B: CHUNKED PROCESSING (>8 pages or single request failed)
      console.log(`📚 Using chunked processing: ${pageCount} pages in 8-page chunks...`);
      const textChunks: string[] = [];
      
      // Process document in 8-page chunks
      for (let startPage = 1; startPage <= pageCount; startPage += 8) {
        const endPage = Math.min(startPage + 7, pageCount);
        try {
          const chunkText = await processPageChunk(fileId, startPage, endPage, mistralApiKey);
          if (chunkText.trim()) {
            textChunks.push(chunkText);
          }
        } catch (chunkError) {
          console.warn(`⚠️ Failed to process chunk ${startPage}-${endPage}:`, chunkError);
          // Continue processing other chunks even if one fails
        }
      }
      
      // Combine all chunks with clear page break markers
      extractedText = textChunks.join('\n\n--- PAGE BREAK ---\n\n');
      console.log(`✅ Chunked processing completed: ${textChunks.length}/${Math.ceil(pageCount/8)} chunks successful`);
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error('Mistral OCR returned insufficient text content');
    }

    // Calculate confidence based on text quality
    const confidence = calculateOcrConfidence(extractedText);
    
    console.log(`✅ Mistral OCR completed: ${extractedText.length} characters extracted from ${totalPageCount} pages`);

    return {
      text: extractedText,
      confidence: confidence,
      pageCount: totalPageCount
    };

  } catch (error) {
    console.error('❌ Mistral OCR extraction failed:', error);
    throw new Error(`Mistral OCR extraction failed: ${error.message}`);
  } finally {
    // CLEANUP: Remove uploaded file from Mistral storage
    // This prevents storage costs and maintains security
    if (fileId) {
      try {
        console.log(`🧹 Cleaning up uploaded file: ${fileId}`);
        await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
          },
        });
        console.log(`✅ File ${fileId} deleted from Mistral storage`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to delete file ${fileId}:`, cleanupError);
        // Don't throw on cleanup failure - OCR result is still valid
      }
    }
  }
}

/**
 * CALCULATE OCR CONFIDENCE SCORE
 * 
 * Analyzes the extracted text to estimate OCR accuracy and quality.
 * Higher scores indicate more reliable text extraction.
 * 
 * CONFIDENCE FACTORS:
 * - Alphanumeric ratio: Higher percentage of letters/numbers vs symbols
 * - Word count: More words generally indicate better extraction
 * - Average word length: Reasonable word lengths suggest accuracy
 * - Total text length: Longer texts provide more confidence data
 * 
 * @param text - Extracted text to analyze
 * @returns Confidence score between 0.1 (poor) and 0.95 (excellent)
 */
function calculateOcrConfidence(text: string): number {
  if (!text || text.length < 10) return 0.1;
  
  // Analyze text characteristics for quality assessment
  const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const avgWordLength = text.replace(/\s+/g, '').length / Math.max(wordCount, 1);
  
  // Start with base confidence for OCR processing
  let confidence = 0.5;
  
  // Boost confidence for readable text characteristics
  if (alphanumericRatio > 0.7) confidence += 0.2;  // Good text vs symbols ratio
  if (wordCount > 50) confidence += 0.1;           // Substantial content
  if (avgWordLength >= 3 && avgWordLength <= 8) confidence += 0.1; // Reasonable word lengths
  if (text.length > 100) confidence += 0.1;       // Sufficient content length
  
  return Math.min(0.95, Math.max(0.1, confidence));
}