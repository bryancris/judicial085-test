
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { ProcessPdfRequest } from './types.ts';
import { extractTextFromPdfBuffer, chunkDocument } from './pdfProcessor.ts';
import { generateAndStoreEmbeddings, updateDocumentStatus } from './databaseService.ts';

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

  try {
    console.log('PDF processing function called');
    
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { documentId, clientId, caseId, title, fileUrl, fileName }: ProcessPdfRequest = requestBody;
    
    console.log(`Starting PDF processing for document ${documentId}, file: ${fileName}`);

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

    // Step 2: Extract text using pdf-parse
    const extractedText = await extractTextFromPdfBuffer(pdfData);
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text content could be extracted from the PDF');
    }
    
    console.log(`Text extraction completed: ${extractedText.length} characters`);

    // Step 3: Chunk the extracted text
    const chunks = chunkDocument(extractedText);
    console.log(`Document chunked into ${chunks.length} pieces`);

    // Step 4: Generate embeddings and store chunks
    await generateAndStoreEmbeddings(chunks, documentId, clientId, {
      pdfUrl: fileUrl,
      isPdfDocument: true,
      caseId: caseId || null,
      fileName: fileName
    }, supabase, openaiApiKey);

    // Step 5: Mark as completed
    await updateDocumentStatus(documentId, 'completed', supabase);

    console.log(`PDF processing completed successfully for document: ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      message: 'PDF processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error processing PDF:', error);
    
    // Try to extract document ID from request body to update status
    try {
      const body = await req.text();
      const parsedBody = JSON.parse(body);
      if (parsedBody.documentId) {
        await updateDocumentStatus(parsedBody.documentId, 'failed', supabase, error.message);
      }
    } catch (e) {
      console.error('Could not parse request body for error handling:', e);
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to process PDF document'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
