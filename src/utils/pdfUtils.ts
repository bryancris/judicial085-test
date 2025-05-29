
import { supabase } from '@/integrations/supabase/client';
import * as pdfjs from 'pdfjs-dist';

// Set the PDF.js worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Extract text from a PDF file
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfData = new Uint8Array(fileArrayBuffer);
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

// Upload PDF file to Supabase Storage
export const uploadPdfToStorage = async (file: File, clientId: string, caseId?: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;
    
    // Upload file to client_documents bucket
    const { data, error } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw new Error('Failed to upload PDF file to storage');
  }
};

// Generate embeddings using the edge function
export const generateEmbeddings = async (
  textChunks: string[], 
  documentId: string, 
  clientId: string, 
  metadata: any = {}
): Promise<void> => {
  try {
    console.log(`Generating embeddings for ${textChunks.length} chunks using edge function`);
    
    // Call the generate-embeddings edge function
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        texts: textChunks,
        documentId,
        clientId,
        metadata
      }
    });
    
    if (error) {
      console.error('Error from generate-embeddings function:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    
    if (!data || !data.results) {
      throw new Error('Invalid response from embeddings function');
    }
    
    // Check if any chunks failed
    const failedChunks = data.results.filter((result: any) => !result.success);
    if (failedChunks.length > 0) {
      console.warn(`${failedChunks.length} chunks failed to process:`, failedChunks);
    }
    
    console.log(`Successfully processed ${data.results.filter((r: any) => r.success).length} chunks`);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

// Process PDF document for a client/case
export const processPdfDocument = async (
  file: File, 
  title: string, 
  clientId: string,
  caseId?: string
): Promise<{success: boolean, documentId?: string, error?: string}> => {
  try {
    console.log(`Starting PDF processing for file: ${file.name}`);
    
    // Step 1: Extract text from PDF
    const extractedText = await extractTextFromPdf(file);
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text could be extracted from the PDF');
    }
    
    console.log(`Extracted ${extractedText.length} characters from PDF`);
    
    // Step 2: Upload PDF to storage
    const pdfUrl = await uploadPdfToStorage(file, clientId, caseId);
    console.log(`PDF uploaded to: ${pdfUrl}`);
    
    // Step 3: Generate a unique ID for the document
    const documentId = crypto.randomUUID();
    
    // Step 4: Insert document metadata with case_id if provided
    const { error: metadataError } = await supabase
      .from('document_metadata')
      .insert({
        id: documentId,
        title,
        client_id: clientId,
        case_id: caseId || null,
        schema: caseId ? 'case_document' : 'client_document',
        url: pdfUrl
      });
    
    if (metadataError) {
      throw new Error(`Error creating document metadata: ${metadataError.message}`);
    }
    
    console.log(`Document metadata created with ID: ${documentId}`);
    
    // Step 5: Chunk the extracted text
    const chunks = chunkDocument(extractedText);
    console.log(`Document chunked into ${chunks.length} pieces`);
    
    // Step 6: Generate embeddings and store chunks using edge function
    await generateEmbeddings(chunks, documentId, clientId, { 
      pdfUrl, 
      isPdfDocument: true,
      caseId: caseId || null,
      fileName: file.name
    });
    
    console.log(`PDF processing completed successfully for document: ${documentId}`);
    return { success: true, documentId };
  } catch (error: any) {
    console.error('Error processing PDF document:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to chunk document content
const chunkDocument = (content: string): string[] => {
  // Simple chunking by paragraphs with a max length
  const MAX_CHUNK_LENGTH = 1000;
  const paragraphs = content.split(/\n\s*\n/);
  const chunks: string[] = [];
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max length, start a new chunk
    if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    // Add paragraph to current chunk
    if (currentChunk.length > 0) {
      currentChunk += '\n\n' + paragraph;
    } else {
      currentChunk = paragraph;
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};
