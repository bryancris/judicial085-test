
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProcessPdfRequest {
  documentId: string;
  clientId: string;
  caseId?: string;
  title: string;
  fileUrl: string;
  fileName: string;
}

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
    await updateDocumentStatus(documentId, 'processing');

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
    });

    // Step 5: Mark as completed
    await updateDocumentStatus(documentId, 'completed');

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
        await updateDocumentStatus(parsedBody.documentId, 'failed', error.message);
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

// Extract text from PDF buffer using pdf-parse
async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    // Import pdf-parse dynamically
    const { default: pdfParse } = await import('https://esm.sh/pdf-parse@1.1.1');
    
    console.log('Starting PDF text extraction...');
    const data = await pdfParse(pdfData);
    
    if (!data.text || data.text.trim() === '') {
      throw new Error('PDF contains no extractable text content');
    }
    
    console.log(`Successfully extracted ${data.text.length} characters from ${data.numpages} pages`);
    return data.text;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('The uploaded file appears to be corrupted or not a valid PDF.');
    } else if (error.message?.includes('Password')) {
      throw new Error('Password-protected PDFs are not supported.');
    } else {
      throw new Error('Failed to extract text from PDF file. Please ensure the file is a valid, readable PDF.');
    }
  }
}

// Chunk document content
function chunkDocument(content: string): string[] {
  const MAX_CHUNK_LENGTH = 1000;
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    if (currentChunk.length > 0) {
      currentChunk += '\n\n' + paragraph;
    } else {
      currentChunk = paragraph;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Generate embeddings and store chunks
async function generateAndStoreEmbeddings(
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {}
): Promise<void> {
  console.log(`Generating embeddings for ${textChunks.length} chunks`);
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    try {
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk);
      
      // Store the chunk with its embedding
      const { error } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          client_id: clientId,
          case_id: metadata.caseId,
          chunk_index: i,
          content: chunk,
          embedding: embedding,
          metadata: {
            ...metadata,
            chunk_length: chunk.length,
            total_chunks: textChunks.length
          }
        });
      
      if (error) {
        throw new Error(`Failed to store chunk ${i}: ${error.message}`);
      }
      
      console.log(`Stored chunk ${i + 1}/${textChunks.length}`);
    } catch (error: any) {
      console.error(`Error processing chunk ${i}:`, error);
      throw error;
    }
  }
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorData}`);
  }
  
  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding data received from OpenAI');
  }
  
  return data.data[0].embedding;
}

// Update document processing status
async function updateDocumentStatus(
  documentId: string, 
  status: 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  const updateData: any = {
    processing_status: status,
    processed_at: new Date().toISOString()
  };
  
  if (error) {
    updateData.processing_error = error;
  }
  
  const { error: updateError } = await supabase
    .from('document_metadata')
    .update(updateData)
    .eq('id', documentId);
  
  if (updateError) {
    console.error(`Failed to update document status to ${status}:`, updateError);
  } else {
    console.log(`Document ${documentId} status updated to: ${status}`);
  }
}
