
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { validateRequest, downloadPdf } from './handlers/requestHandler.ts';
import { createSuccessResponse, createErrorResponse } from './handlers/responseHandler.ts';
import { handleProcessingError } from './handlers/errorHandler.ts';
import { processDocument } from './services/unifiedDocumentProcessor.ts';
import { chunkDocumentAdvanced } from './utils/chunkingUtils.ts';
import { generateAndStoreEmbeddings } from './services/embeddingService.ts';
import { updateDocumentStatus } from './services/documentStatusService.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

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
    console.log('🚀 === UNIFIED DOCUMENT PROCESSING SYSTEM v9.1 ===');
    
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    const requestBody = await req.json();
    console.log('📋 Processing request:', {
      documentId: requestBody.documentId,
      fileName: requestBody.fileName,
      clientId: requestBody.clientId,
      caseId: requestBody.caseId || 'none'
    });
    
    const validatedRequest = validateRequest(requestBody);
    documentId = validatedRequest.documentId;
    
    console.log(`📄 Starting unified document processing: ${validatedRequest.fileName} for client: ${validatedRequest.clientId}`);

    // Mark document as processing
    await updateDocumentStatus(supabase, documentId, 'processing', validatedRequest.fileUrl);

    // Download the file
    const fileData = await downloadPdf(validatedRequest.fileUrl);
    console.log(`✅ File downloaded successfully: ${fileData.length} bytes`);

    // Use unified document processor for all file types
    console.log('🔍 === STARTING UNIFIED DOCUMENT EXTRACTION ===');
    const extractionResult = await processDocument(
      fileData,
      validatedRequest.fileName,
      undefined // Let the processor detect MIME type from filename
    );

    console.log(`✅ Unified extraction completed: {
  method: "${extractionResult.method}",
  textLength: ${extractionResult.text.length},
  quality: ${extractionResult.quality},
  confidence: ${extractionResult.confidence},
  pageCount: ${extractionResult.pageCount},
  fileType: ${extractionResult.fileType},
  processingNotes: '${extractionResult.processingNotes}'
}`);

    // Enhanced document chunking
    console.log('📂 === STARTING DOCUMENT CHUNKING ===');
    const chunks = chunkDocumentAdvanced(extractionResult.text);
    console.log(`✅ Chunking completed: ${chunks.length} chunks created`);

    // Generate embeddings for chunks using the correct function
    console.log('🧠 === STARTING EMBEDDING GENERATION ===');
    await generateAndStoreEmbeddings(
      chunks,
      documentId,
      validatedRequest.clientId,
      validatedRequest.caseId,
      supabase,
      openaiApiKey,
      {
        fileName: validatedRequest.fileName,
        fileUrl: validatedRequest.fileUrl,
        extractionMethod: extractionResult.method,
        quality: extractionResult.quality,
        confidence: extractionResult.confidence,
        pageCount: extractionResult.pageCount
      }
    );

    console.log('✅ Advanced processing completed with embeddings for search functionality');

    // Mark document as completed and preserve URL
    await updateDocumentStatus(supabase, documentId, 'completed', validatedRequest.fileUrl);

    console.log('🎉 === UNIFIED DOCUMENT PROCESSING COMPLETED SUCCESSFULLY ===');

    return createSuccessResponse(
      validatedRequest.documentId,
      chunks,
      extractionResult,
      validatedRequest.fileName
    );

  } catch (error: any) {
    console.error('❌ Processing pipeline failed:', error);
    await handleProcessingError(error, documentId, supabase);
    return createErrorResponse(error, documentId);
  }
});
