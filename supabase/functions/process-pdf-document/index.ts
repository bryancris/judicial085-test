
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { ProcessPdfRequest } from './types.ts';
import { extractTextFromPdfBuffer, chunkDocument } from './pdfProcessor.ts';
import { generateAndStoreEmbeddings, updateDocumentStatus, cleanupFailedDocument } from './databaseService.ts';

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
    console.log('PDF processing function called');
    
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { documentId: reqDocumentId, clientId, caseId, title, fileUrl, fileName }: ProcessPdfRequest = requestBody;
    documentId = reqDocumentId;
    
    console.log(`Starting PDF processing for document ${documentId}, file: ${fileName}`);

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

    // Step 2: Extract text using comprehensive extraction
    console.log('Starting text extraction...');
    const extractedText = await extractTextFromPdfBuffer(pdfData);
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No readable text content could be extracted from the PDF');
    }
    
    console.log(`Text extraction completed: ${extractedText.length} characters`);
    console.log(`Text preview: "${extractedText.substring(0, 300)}..."`);

    // Step 3: Validate extracted text quality
    const words = extractedText.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversityRatio = uniqueWords.size / words.length;
    
    if (diversityRatio < 0.1) {
      throw new Error('Extracted text appears to be repetitive or corrupted');
    }

    // Step 4: Chunk the extracted text
    console.log('Starting chunking...');
    const chunks = chunkDocument(extractedText);
    console.log(`Document chunked into ${chunks.length} pieces`);

    if (chunks.length === 0) {
      throw new Error('Failed to create valid chunks from extracted text');
    }

    // Log chunk previews for verification
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} preview (${chunk.length} chars): "${chunk.substring(0, 100)}..."`);
    });

    // Step 5: Generate embeddings and store chunks
    console.log('Generating embeddings for chunks...');
    await generateAndStoreEmbeddings(chunks, documentId, clientId, {
      pdfUrl: fileUrl,
      isPdfDocument: true,
      caseId: caseId || null,
      fileName: fileName,
      extractionMethod: 'comprehensive',
      textPreview: extractedText.substring(0, 500),
      diversityRatio: diversityRatio
    }, supabase, openaiApiKey);

    // Step 6: Store content preview in document_metadata for display
    const contentPreview = extractedText.substring(0, 1000);
    await supabase
      .from('document_metadata')
      .update({ 
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);

    console.log(`PDF processing completed successfully for document: ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      chunksCreated: chunks.length,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 200),
      diversityRatio: diversityRatio,
      message: 'PDF processed successfully with comprehensive extraction'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('PDF processing error:', error);
    
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
      details: 'PDF processing failed - please ensure the PDF contains readable text content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
