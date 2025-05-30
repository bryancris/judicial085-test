
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { corsHeaders } from './corsUtils.ts';
import { ProcessPdfRequest } from './types.ts';
import { extractTextFromPdfAdvanced, chunkDocumentAdvanced } from './advancedPdfProcessor.ts';
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
    console.log('=== ADVANCED PDF PROCESSING WITH FIXED DENO COMPATIBILITY ===');
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    const requestBody = await req.json();
    console.log('Processing request:', {
      documentId: requestBody.documentId,
      fileName: requestBody.fileName,
      clientId: requestBody.clientId,
      caseId: requestBody.caseId || 'none'
    });
    
    const { documentId: reqDocumentId, clientId, caseId, title, fileUrl, fileName }: ProcessPdfRequest = requestBody;
    documentId = reqDocumentId;
    
    // Validate required fields
    if (!documentId || !clientId || !fileUrl || !fileName) {
      throw new Error('Missing required fields: documentId, clientId, fileUrl, or fileName');
    }
    
    console.log(`Starting advanced PDF processing: ${fileName} for client: ${clientId}`);

    await updateDocumentStatus(documentId, 'processing', supabase);

    // Step 1: Download PDF with enhanced validation
    console.log(`Downloading PDF from: ${fileUrl}`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90 second timeout for large files
    
    const downloadResponse = await fetch(fileUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Legal-AI-Advanced-PDF-Processor/3.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (!downloadResponse.ok) {
      throw new Error(`PDF download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }
    
    const pdfArrayBuffer = await downloadResponse.arrayBuffer();
    
    // Enhanced file validation
    if (pdfArrayBuffer.byteLength === 0) {
      throw new Error('Downloaded PDF file is empty');
    }
    
    if (pdfArrayBuffer.byteLength > 25 * 1024 * 1024) { // 25MB limit
      throw new Error('PDF file too large (max 25MB). Please compress the file and try again.');
    }
    
    const pdfData = new Uint8Array(pdfArrayBuffer);
    console.log(`PDF downloaded successfully: ${pdfData.length} bytes`);

    // Step 2: Advanced multi-strategy text extraction with Deno compatibility
    console.log('=== STARTING ADVANCED PDF TEXT EXTRACTION ===');
    let extractionResult;
    
    try {
      extractionResult = await extractTextFromPdfAdvanced(pdfData);
      
      console.log(`Advanced extraction completed:`, {
        method: extractionResult.method,
        textLength: extractionResult.text.length,
        quality: extractionResult.quality,
        confidence: extractionResult.confidence,
        pageCount: extractionResult.pageCount,
        isScanned: extractionResult.isScanned
      });
      
      console.log(`Content preview: "${extractionResult.text.substring(0, 300)}..."`);
      
    } catch (extractionError) {
      console.error('All advanced extraction methods failed:', extractionError);
      throw new Error(`Advanced PDF extraction failed: ${extractionError.message}`);
    }

    // Step 3: Advanced content-aware document chunking
    console.log('=== STARTING ADVANCED DOCUMENT CHUNKING ===');
    let chunks: string[] = [];
    
    try {
      chunks = chunkDocumentAdvanced(extractionResult.text, {
        method: extractionResult.method,
        isScanned: extractionResult.isScanned,
        quality: extractionResult.quality
      });
      
      console.log(`Advanced chunking completed: ${chunks.length} chunks created`);
      
      // Log chunk samples for debugging
      if (chunks.length > 0) {
        console.log(`First chunk sample: "${chunks[0].substring(0, 150)}..."`);
        if (chunks.length > 1) {
          console.log(`Last chunk sample: "${chunks[chunks.length - 1].substring(0, 150)}..."`);
        }
      }
      
    } catch (chunkingError) {
      console.error('Advanced chunking failed:', chunkingError);
      chunks = [extractionResult.text];
    }

    if (chunks.length === 0) {
      console.warn('No chunks created, creating fallback chunk');
      chunks = [extractionResult.text || `Document: ${fileName} - Advanced processing completed but content extraction was minimal.`];
    }

    // Step 4: Generate embeddings and store with comprehensive metadata
    console.log('=== STARTING ADVANCED EMBEDDING GENERATION ===');
    
    const processingMetadata = {
      pdfUrl: fileUrl,
      isPdfDocument: true,
      caseId: caseId || null,
      fileName: fileName,
      extractionMethod: extractionResult.method,
      isScannedDocument: extractionResult.isScanned,
      extractionQuality: extractionResult.quality,
      extractionConfidence: extractionResult.confidence,
      pageCount: extractionResult.pageCount,
      textPreview: extractionResult.text.substring(0, 500),
      processingNotes: extractionResult.processingNotes,
      chunkCount: chunks.length,
      originalTextLength: extractionResult.text.length,
      pdfSize: pdfData.length,
      processingVersion: '5.0-deno-compatible-fixed',
      advancedProcessing: true,
      contentType: detectContentTypeFromText(extractionResult.text),
      processingTimestamp: new Date().toISOString()
    };
    
    try {
      await generateAndStoreEmbeddings(
        chunks, 
        documentId, 
        clientId, 
        processingMetadata,
        supabase, 
        openaiApiKey || ''
      );
      
      console.log('Advanced embeddings generated and stored successfully');
      
    } catch (embeddingError) {
      console.error('Advanced embedding generation failed:', embeddingError);
      
      // Store without embeddings but with detailed error info
      try {
        await generateAndStoreEmbeddings(
          chunks, 
          documentId, 
          clientId, 
          {
            ...processingMetadata,
            embeddingError: embeddingError.message,
            processingNotes: `${extractionResult.processingNotes}. Embeddings failed: ${embeddingError.message}`
          },
          supabase, 
          '' // Empty API key to skip embeddings
        );
        
        await updateDocumentStatus(
          documentId, 
          'completed', 
          supabase, 
          'Document processed successfully but search indexing failed'
        );
        
        return new Response(JSON.stringify({ 
          success: true, 
          documentId,
          chunksCreated: chunks.length,
          textLength: extractionResult.text.length,
          textPreview: extractionResult.text.substring(0, 400),
          extractionMethod: extractionResult.method,
          quality: extractionResult.quality,
          confidence: extractionResult.confidence,
          isScanned: extractionResult.isScanned,
          warning: 'Document stored successfully but search indexing unavailable'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (storageError) {
        console.error('Failed to store document even without embeddings:', storageError);
        throw embeddingError; // Throw original embedding error
      }
    }

    // Step 5: Mark as completed with comprehensive success details
    await updateDocumentStatus(documentId, 'completed', supabase);

    console.log(`=== ADVANCED PDF PROCESSING COMPLETED SUCCESSFULLY ===`);
    console.log(`Document: ${documentId}, Method: ${extractionResult.method}, Quality: ${extractionResult.quality}, Chunks: ${chunks.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      documentId,
      chunksCreated: chunks.length,
      textLength: extractionResult.text.length,
      textPreview: extractionResult.text.substring(0, 400),
      extractionMethod: extractionResult.method,
      quality: extractionResult.quality,
      confidence: extractionResult.confidence,
      pageCount: extractionResult.pageCount,
      isScanned: extractionResult.isScanned,
      processingNotes: extractionResult.processingNotes,
      message: 'PDF processed successfully with Deno-compatible advanced extraction',
      processingVersion: '5.0-deno-compatible-fixed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('=== ADVANCED PDF PROCESSING FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (documentId) {
      try {
        await cleanupFailedDocument(documentId, supabase);
        await updateDocumentStatus(documentId, 'failed', supabase, error.message);
        console.log('Document status updated to failed with cleanup');
      } catch (updateError) {
        console.error('Failed to update document status or cleanup:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Advanced PDF processing failed',
      details: `Deno-compatible processing failed: ${error.message}`,
      documentId: documentId,
      timestamp: new Date().toISOString(),
      processingVersion: '5.0-deno-compatible-fixed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to detect content type from extracted text
function detectContentTypeFromText(content: string): string {
  if (!content) return 'unknown';
  
  const lowerContent = content.toLowerCase();
  
  // Email content detection
  if (/^(from|to|subject|date):/m.test(content) || 
      /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
    return 'email';
  }
  
  // Legal document patterns
  if (/\b(whereas|party|agreement|contract|shall|thereof)\b/i.test(content)) {
    return 'legal_document';
  }
  
  // Letter format
  if (/\b(dear|sincerely|regards|yours|truly)\b/i.test(content)) {
    return 'correspondence';
  }
  
  // Form or structured data
  if (/^[A-Z][^.]*:/.test(content) || content.includes('___')) {
    return 'form';
  }
  
  // General text content
  if (/[.!?]/.test(content) && content.split(/\s+/).length > 10) {
    return 'text_document';
  }
  
  return 'mixed_content';
}
