
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
    console.log('🚀 === DOCUMENT PROCESSING SYSTEM WITH OCR FALLBACK v12.0 ===');
    
    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
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
    
    console.log(`📄 Starting document processing: ${validatedRequest.fileName} for client: ${validatedRequest.clientId}`);

    // Mark document as processing
    await updateDocumentStatus(supabase, documentId, 'processing', validatedRequest.fileUrl);

    // Download the file
    const fileData = await downloadPdf(validatedRequest.fileUrl);
    console.log(`✅ File downloaded successfully: ${fileData.length} bytes`);

    // Use unified document processor with automatic OCR fallback for scanned documents
    console.log('🔍 === STARTING UNIFIED DOCUMENT PROCESSING WITH AUTOMATIC OCR FALLBACK ===');
    const extractionResult = await processDocument(
      fileData,
      validatedRequest.fileName,
      undefined // Let the processor detect MIME type from filename
    );

    console.log(`✅ Document extraction completed using ${extractionResult.method}: {
  textLength: ${extractionResult.text.length},
  quality: ${extractionResult.quality},
  confidence: ${extractionResult.confidence},
  pageCount: ${extractionResult.pageCount},
  fileType: ${extractionResult.fileType},
  isScanned: ${extractionResult.isScanned || false},
  processingNotes: '${extractionResult.processingNotes}'
}`);

    // DEBUG: Check if we're getting actual OCR content vs placeholder
    if (extractionResult.text.includes('DOCUMENT PROCESSING REPORT') || 
        extractionResult.text.includes('SCANNED DOCUMENT - OCR PROCESSING ATTEMPTED')) {
      console.log('⚠️ === OCR FALLBACK DETECTED - INVESTIGATING ===');
      console.log(`Processing method: ${extractionResult.method}`);
      console.log(`Is scanned: ${extractionResult.isScanned}`);
      console.log(`Processing notes: ${extractionResult.processingNotes}`);
      console.log(`Text preview: "${extractionResult.text.substring(0, 300)}..."`);
    }

    // Provide clear user feedback about processing method used
    if (extractionResult.isScanned) {
      console.log('📷 Document was processed using OCR for scanned content');
      await updateDocumentStatus(
        supabase, 
        documentId, 
        'processing', 
        validatedRequest.fileUrl, 
        `OCR processing completed. ${extractionResult.processingNotes}`
      );
    } else {
      console.log('📄 Document processed using standard text extraction');
    }

    // Enhanced document chunking
    console.log('📂 === STARTING DOCUMENT CHUNKING ===');
    const chunks = chunkDocumentAdvanced(extractionResult.text);
    console.log(`✅ Chunking completed: ${chunks.length} chunks created`);

    // Note: Keep OpenAI embeddings for now (hybrid approach)
    // Gemini doesn't have competitive embedding models yet
    console.log('🧠 === STARTING EMBEDDING GENERATION (OpenAI) ===');
    await generateAndStoreEmbeddings(
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

    console.log('✅ Document processing completed with embeddings for search functionality');

    // Mark document as completed and preserve URL
    const finalProcessingNotes = extractionResult.isScanned 
      ? `Successfully processed scanned document using OCR. ${extractionResult.processingNotes}`
      : `Successfully processed document using standard extraction. ${extractionResult.processingNotes}`;
    
    await updateDocumentStatus(supabase, documentId, 'completed', validatedRequest.fileUrl, finalProcessingNotes);

    console.log('🎉 === DOCUMENT PROCESSING WITH AUTOMATIC OCR FALLBACK COMPLETED SUCCESSFULLY ===');

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
