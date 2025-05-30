
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { validateRequest, downloadPdf } from './handlers/requestHandler.ts';
import { createSuccessResponse, createErrorResponse } from './handlers/responseHandler.ts';
import { handleProcessingError } from './handlers/errorHandler.ts';
import { processPdfDocument } from './processors/pdfProcessor.ts';

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
    console.log('🚀 === WORKING PDF PROCESSING SYSTEM v8.0 ===');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
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
    
    console.log(`📄 Starting WORKING PDF processing: ${validatedRequest.fileName} for client: ${validatedRequest.clientId}`);

    const pdfData = await downloadPdf(validatedRequest.fileUrl);

    const { extractionResult, chunks } = await processPdfDocument(
      pdfData,
      validatedRequest.documentId,
      validatedRequest.clientId,
      validatedRequest.caseId,
      validatedRequest.fileName,
      validatedRequest.fileUrl,
      supabase,
      openaiApiKey || ''
    );

    return createSuccessResponse(
      validatedRequest.documentId,
      chunks,
      extractionResult,
      validatedRequest.fileName
    );

  } catch (error: any) {
    await handleProcessingError(error, documentId, supabase);
    return createErrorResponse(error, documentId);
  }
});
