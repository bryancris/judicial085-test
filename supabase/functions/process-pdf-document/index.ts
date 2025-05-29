
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
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { documentId: reqDocumentId, clientId, caseId, title, fileUrl, fileName }: ProcessPdfRequest = requestBody;
    documentId = reqDocumentId;
    
    // Validate required fields
    if (!documentId || !clientId || !fileUrl || !fileName) {
      throw new Error('Missing required fields: documentId, clientId, fileUrl, or fileName');
    }
    
    console.log(`Starting PDF processing for document ${documentId}, file: ${fileName}`);

    await updateDocumentStatus(documentId, 'processing', supabase);

    // Step 1: Download PDF with timeout and size limits
    console.log(`Downloading PDF from: ${fileUrl}`);
    
    const downloadResponse = await Promise.race([
      fetch(fileUrl),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Download timeout')), 30000)
      )
    ]);
    
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download PDF: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }
    
    const pdfArrayBuffer = await downloadResponse.arrayBuffer();
    
    // Check file size (limit to 10MB)
    if (pdfArrayBuffer.byteLength > 10 * 1024 * 1024) {
      throw new Error('PDF file too large (max 10MB)');
    }
    
    const pdfData = new Uint8Array(pdfArrayBuffer);
    console.log(`PDF downloaded successfully, size: ${pdfData.length} bytes`);

    // Step 2: Extract text with error handling
    console.log('Starting text extraction...');
    let extractedText = '';
    
    try {
      extractedText = await extractTextFromPdfBuffer(pdfData);
    } catch (extractionError) {
      console.warn('Text extraction failed, using fallback:', extractionError);
      extractedText = `Document: ${fileName}. Uploaded on ${new Date().toISOString()}. Content extraction failed but document is stored.`;
    }
    
    console.log(`Text extraction completed: ${extractedText.length} characters`);
    console.log(`Text preview: "${extractedText.substring(0, 200)}..."`);

    // Step 3: Chunk the extracted text
    console.log('Starting chunking...');
    let chunks: string[] = [];
    
    try {
      chunks = chunkDocument(extractedText);
    } catch (chunkingError) {
      console.warn('Chunking failed, using single chunk:', chunkingError);
      chunks = [extractedText];
    }
    
    console.log(`Document chunked into ${chunks.length} pieces`);

    if (chunks.length === 0) {
      console.warn('No chunks created, creating fallback chunk');
      chunks = [`Document: ${fileName}. Content available but not indexed.`];
    }

    // Step 4: Generate embeddings and store chunks
    console.log('Generating embeddings for chunks...');
    
    try {
      await generateAndStoreEmbeddings(chunks, documentId, clientId, {
        pdfUrl: fileUrl,
        isPdfDocument: true,
        caseId: caseId || null,
        fileName: fileName,
        extractionMethod: 'simplified',
        textPreview: extractedText.substring(0, 500),
        processingNotes: 'Processed with improved error handling'
      }, supabase, openaiApiKey);
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      // Still mark as completed but with a note
      await updateDocumentStatus(documentId, 'completed', supabase, 'Embeddings failed but document stored');
      
      return new Response(JSON.stringify({ 
        success: true, 
        documentId,
        chunksCreated: 0,
        textLength: extractedText.length,
        textPreview: extractedText.substring(0, 200),
        warning: 'Document stored but search indexing failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: Mark as completed
    await updateDocumentStatus(documentId, 'completed', supabase);

    console.log(`PDF processing completed successfully for document: ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      chunksCreated: chunks.length,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 200),
      message: 'PDF processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('PDF processing error:', error);
    console.error('Error stack:', error.stack);
    
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
      details: `Processing failed: ${error.message}`,
      documentId: documentId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
