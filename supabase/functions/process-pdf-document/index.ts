
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

serve(async (req) => {
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
    
    // Set up timeout protection (55 seconds max for edge function - allows for OCR operations)
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⚠️ Edge function timeout approaching, terminating gracefully');
      timeoutController.abort();
    }, 55000); // 55 second timeout to allow for 45s document processing + overhead
    
    const requestBody = await req.json();
    console.log('📋 Processing request:', {
      documentId: requestBody.documentId,
      fileName: requestBody.fileName,
      clientId: requestBody.clientId,
      caseId: requestBody.caseId || 'none'
    });
    
    const validatedRequest = validateRequest(requestBody);
    documentId = validatedRequest.documentId;
    
    console.log(`📄 Starting document processing: ${validatedRequest.fileName} for client: ${validatedRequest.clientId}`);

    // Mark document as processing
    await updateDocumentStatus(supabase, documentId, 'processing', validatedRequest.fileUrl);

    // Download the file with timeout
    const fileData = await Promise.race([
      downloadPdf(validatedRequest.fileUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('File download timeout')), 10000)
      )
    ]) as Uint8Array;
    console.log(`✅ File downloaded successfully: ${fileData.length} bytes`);

    // Process document with timeout protection (increased to 45 seconds to allow OCR to complete)
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

    // Store full text without chunking for OCR results
    console.log('📂 === PREPARING DOCUMENT STORAGE ===');
    const chunks = [extractionResult.text]; // Store as single chunk to avoid resource exhaustion
    console.log(`✅ Document prepared for storage: ${extractionResult.text.length} characters`);

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

    // Continue embeddings generation in background using EdgeRuntime.waitUntil
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

    // Use EdgeRuntime.waitUntil to continue processing in background
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
