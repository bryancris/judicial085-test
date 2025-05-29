
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { ProcessPdfRequest } from './types.ts';
import { extractTextFromPdfBuffer, chunkDocument } from './pdfProcessor.ts';
import { generateAndStoreEmbeddings, updateDocumentStatus, cleanupFailedDocument } from './databaseService.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log('Enhanced PDF processing function called');
    
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { documentId: reqDocumentId, clientId, caseId, title, fileUrl, fileName }: ProcessPdfRequest = requestBody;
    documentId = reqDocumentId;
    
    console.log(`Starting enhanced PDF processing for document ${documentId}, file: ${fileName}`);

    // Update status to processing
    await updateDocumentStatus(documentId, 'processing', supabase);

    // Step 1: Download PDF from storage
    console.log(`Downloading PDF from: ${fileUrl}`);
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfData = new Uint8Array(pdfArrayBuffer);
    
    console.log(`PDF downloaded successfully, size: ${pdfData.length} bytes`);

    // Step 2: Extract text using enhanced extraction
    console.log('Starting enhanced text extraction...');
    const extractedText = await extractTextFromPdfBuffer(pdfData);
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No readable text content could be extracted from the PDF');
    }
    
    console.log(`Enhanced text extraction completed: ${extractedText.length} characters of readable content`);
    console.log(`Text preview: "${extractedText.substring(0, 200)}..."`);

    // Step 3: Chunk the extracted text with enhanced validation
    console.log('Starting enhanced chunking...');
    const chunks = chunkDocument(extractedText);
    console.log(`Document chunked into ${chunks.length} validated pieces`);

    if (chunks.length === 0) {
      throw new Error('Failed to create valid chunks from extracted text');
    }

    // Log chunk previews for verification
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} preview (${chunk.length} chars): "${chunk.substring(0, 150)}..."`);
    });

    // Step 4: Generate embeddings and store chunks
    console.log('Generating embeddings for validated chunks...');
    await generateAndStoreEmbeddings(chunks, documentId, clientId, {
      pdfUrl: fileUrl,
      isPdfDocument: true,
      caseId: caseId || null,
      fileName: fileName,
      extractionMethod: 'enhanced',
      textPreview: extractedText.substring(0, 500)
    }, supabase, openaiApiKey);

    // Step 5: Mark as completed
    await updateDocumentStatus(documentId, 'completed', supabase);

    console.log(`Enhanced PDF processing completed successfully for document: ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      chunksCreated: chunks.length,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 200),
      message: 'PDF processed successfully with enhanced extraction'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Enhanced PDF processing error:', error);
    
    // Clean up failed document and update status
    if (documentId) {
      try {
        await cleanupFailedDocument(documentId, supabase);
        await updateDocumentStatus(documentId, 'failed', supabase, error.message);
      } catch (updateError) {
        console.error('Failed to cleanup/update document status:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to process PDF document',
      details: 'Enhanced PDF processing failed - please ensure the PDF contains readable text content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
