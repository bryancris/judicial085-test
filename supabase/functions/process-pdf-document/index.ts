
/**
 * ====================================================================
 * PDF DOCUMENT PROCESSING EDGE FUNCTION - MAIN ENTRY POINT
 * ====================================================================
 * 
 * This is the main HTTP handler for processing PDF documents in the legal system.
 * 
 * PROCESSING FLOW:
 * 1. Receives HTTP request with document metadata (ID, URL, client info)
 * 2. Downloads PDF file from storage URL with 10-second timeout
 * 3. Processes document text extraction with 45-second timeout
 * 4. Chunks extracted text for embedding generation
 * 5. Returns early success response (within 55-second edge function limit)
 * 6. Continues embedding generation in background using EdgeRuntime.waitUntil
 * 7. Updates document status to "completed" when background processing finishes
 * 
 * TIMEOUT PROTECTION:
 * - Overall function: 55 seconds (edge function limit)
 * - File download: 10 seconds
 * - Document processing: 45 seconds
 * - Background embeddings: No timeout (runs until completion)
 * 
 * BACKGROUND PROCESSING:
 * Uses EdgeRuntime.waitUntil() to continue embedding generation after returning
 * early response, preventing timeout issues while ensuring all work completes.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { validateRequest, downloadPdf } from './handlers/requestHandler.ts';
import { createSuccessResponse, createErrorResponse } from './handlers/responseHandler.ts';
import { handleProcessingError } from './handlers/errorHandler.ts';
import { processDocument } from './services/unifiedDocumentProcessor.ts';
import { chunkDocumentAdvanced } from './utils/chunkingUtils.ts';
import { generateAndStoreEmbeddings, generateAndStoreEmbeddingsWithTimeout } from './services/embeddingService.ts';
import { updateDocumentStatus } from './services/documentStatusService.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * HTTP REQUEST HANDLER
 * Processes incoming PDF processing requests with comprehensive error handling
 * and timeout protection.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  let documentId: string | null = null;
  
  try {
    console.log('🚀 === DOCUMENT PROCESSING SYSTEM WITH TIMEOUT PROTECTION v14.0 - FORCE REDEPLOY ===');
    console.log(`⏰ Deployment timestamp: ${new Date().toISOString()}`);
    console.log('🔧 Using updated timeout values: Gemini 35s, OpenAI fallback 20s');
    
    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    /**
     * TIMEOUT PROTECTION SETUP
     * Edge functions have a 60-second maximum execution time.
     * We set 55 seconds to allow graceful handling and response sending.
     * This allows 45 seconds for document processing + 10 seconds overhead.
     */
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⚠️ Edge function timeout approaching, terminating gracefully');
      timeoutController.abort();
    }, 55000); // 55 second timeout to allow for 45s document processing + overhead
    
    const requestBody = await req.json();
    console.log('📋 Processing request:', {
      documentId: requestBody.documentId,
      fileName: requestBody.fileName,
      clientId: requestBody.clientId || 'none',
      caseId: requestBody.caseId || 'none',
      userId: requestBody.userId || 'none',
      firmId: requestBody.firmId || 'none'
    });
    
    const validatedRequest = validateRequest(requestBody);
    documentId = validatedRequest.documentId;
    
    console.log(`📄 Starting document processing: ${validatedRequest.fileName} for ${validatedRequest.clientId ? `client: ${validatedRequest.clientId}` : `user: ${validatedRequest.userId || 'unknown'}`}`);

    // Mark document as processing
    await updateDocumentStatus(supabase, documentId, 'processing', validatedRequest.fileUrl);

    /**
     * FILE DOWNLOAD PHASE
     * Downloads PDF from Supabase storage with 10-second timeout.
     * Files are typically small (<10MB) so this should be sufficient.
     */
    const fileData = await Promise.race([
      downloadPdf(validatedRequest.fileUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File download timeout')), 10000)
      )
    ]) as Uint8Array;
    console.log(`✅ File downloaded successfully: ${fileData.length} bytes`);

    /**
     * DOCUMENT PROCESSING PHASE
     * Calls the unified document processor with 45-second timeout.
     * This allows enough time for:
     * - pdf-parse extraction (usually <5 seconds)
     * - Mistral OCR processing (can take 30-40 seconds for large documents)
     * - Fallback processing if needed
     */
    console.log('🔍 === STARTING DOCUMENT PROCESSING WITH EXTENDED TIMEOUT ===');
    
    let extractionResult;
    try {
      extractionResult = await Promise.race([
        processDocument(fileData, validatedRequest.fileName, undefined),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Document processing timeout after 45 seconds')), 45000)
        )
      ]) as any;
    } catch (processingError) {
      console.error('❌ Document processing failed:', processingError);
      throw processingError;
    }

    console.log(`✅ Document extraction completed using ${extractionResult.method}: {
  textLength: ${extractionResult.text.length},
  quality: ${extractionResult.quality},
  confidence: ${extractionResult.confidence},
  pageCount: ${extractionResult.pageCount},
  fileType: ${extractionResult.fileType},
  isScanned: ${extractionResult.isScanned || false},
  processingNotes: '${extractionResult.processingNotes}'
}`);

    /**
     * DOCUMENT CHUNKING PHASE
     * Splits extracted text into optimally-sized chunks for embedding generation.
     * Uses advanced chunking that preserves document structure and legal concepts.
     */
    console.log('📂 === PREPARING DOCUMENT STORAGE ===');
    console.log(`📝 Chunking document: ${extractionResult.text.length} characters`);
    
    const chunks = chunkDocumentAdvanced(extractionResult.text, {
      fileName: validatedRequest.fileName,
      fileType: extractionResult.fileType,
      isLegalDocument: true // Most documents in this system are legal documents
    });
    
    console.log(`✅ Document chunked into ${chunks.length} pieces for embedding`);
    console.log(`📊 Chunk sizes: ${chunks.map(c => c.length).join(', ')} characters`);

    // Clear timeout since we're about to return
    clearTimeout(timeoutId);

    // Update document status to include text extraction completion
    await updateDocumentStatus(
      supabase, 
      documentId, 
      'processing', 
      validatedRequest.fileUrl, 
      `Text extraction completed. Starting embeddings generation in background.`
    );

    // Return early success response - embeddings will continue in background
    const earlyResponse = createSuccessResponse(
      validatedRequest.documentId,
      chunks,
      extractionResult,
      validatedRequest.fileName
    );

    /**
     * BACKGROUND PROCESSING SETUP
     * This task runs after we return the early response to the client.
     * It generates embeddings for all chunks and stores them in the database.
     * This can take several minutes for large documents but doesn't block the response.
     */
    const backgroundTask = async () => {
      try {
        console.log('🧠 === STARTING BACKGROUND EMBEDDING GENERATION ===');
        await generateAndStoreEmbeddingsWithTimeout(
          chunks,
          documentId,
          validatedRequest.clientId,
          validatedRequest.caseId,
          supabase,
          Deno.env.get('OPENAI_API_KEY')!,
          {
            fileName: validatedRequest.fileName,
            fileUrl: validatedRequest.fileUrl,
            extractionMethod: extractionResult.method,
            quality: extractionResult.quality,
            confidence: extractionResult.confidence,
            pageCount: extractionResult.pageCount,
            isScanned: extractionResult.isScanned || false
          }
        );

        // Mark document as completed
        const finalProcessingNotes = extractionResult.isScanned 
          ? `Successfully processed scanned document using OCR. ${extractionResult.processingNotes}`
          : `Successfully processed document using standard extraction. ${extractionResult.processingNotes}`;
        
        await updateDocumentStatus(supabase, documentId, 'completed', validatedRequest.fileUrl, finalProcessingNotes);
        console.log('🎉 === BACKGROUND EMBEDDING GENERATION COMPLETED ===');
        
      } catch (backgroundError) {
        console.error('❌ Background processing failed:', backgroundError);
        await handleProcessingError(backgroundError, documentId, supabase);
      }
    };

    /**
     * BACKGROUND TASK EXECUTION
     * EdgeRuntime.waitUntil keeps the function instance alive until the background
     * task completes, even after we return the response. This prevents the function
     * from shutting down before embeddings are generated.
     */
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      // Fallback: start background task without waiting
      backgroundTask().catch(error => 
        console.error('Background task error:', error)
      );
    }

    console.log('✅ Returning early response - embeddings continue in background');
    return earlyResponse;

  } catch (error: any) {
    console.error('❌ Processing pipeline failed:', error);
    
    // Check if it's a timeout error
    if (error.message?.includes('timeout')) {
      console.log('⚠️ Timeout detected - updating document status');
      if (documentId) {
        await updateDocumentStatus(
          supabase, 
          documentId, 
          'failed', 
          undefined, 
          `Processing timeout: ${error.message}`
        );
      }
    }
    
    await handleProcessingError(error, documentId, supabase);
    return createErrorResponse(error, documentId);
  }
});
