
import { supabase } from "@/integrations/supabase/client";

// PDF processing utility functions
export const extractTextFromPdf = async (file: File): Promise<string[]> => {
  // We'll use PDF.js for extracting text from PDFs
  const pdfjs = await import('pdfjs-dist');
  const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
  
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  return new Promise(async (resolve, reject) => {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // Load the PDF document
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      const textChunks: string[] = [];
      const MAX_CHUNK_LENGTH = 1000; // Same size as in the existing chunking function
      let currentChunk = '';
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        // Split text by paragraphs
        const paragraphs = pageText.split(/\n\s*\n/);
        
        for (const paragraph of paragraphs) {
          if (paragraph.trim().length === 0) continue;
          
          // If adding this paragraph would exceed the max length, start a new chunk
          if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
            textChunks.push(currentChunk);
            currentChunk = '';
          }
          
          // Add paragraph to current chunk
          if (currentChunk.length > 0) {
            currentChunk += '\n\n' + paragraph;
          } else {
            currentChunk = paragraph;
          }
        }
      }
      
      // Add the last chunk if there's anything left
      if (currentChunk.length > 0) {
        textChunks.push(currentChunk);
      }
      
      resolve(textChunks);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      reject(error);
    }
  });
};

export const uploadPdfToStorage = async (
  file: File, 
  clientId: string, 
  documentId: string
): Promise<string> => {
  // Generate a storage path: client_documents/{clientId}/{documentId}.pdf
  const filePath = `${clientId}/${documentId}.pdf`;
  
  // Upload the file to Supabase storage
  const { data, error } = await supabase
    .storage
    .from('client_documents')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  if (error) {
    console.error("Error uploading PDF to storage:", error);
    throw error;
  }
  
  // Return the public URL of the uploaded file
  const { data: publicUrlData } = supabase
    .storage
    .from('client_documents')
    .getPublicUrl(filePath);
  
  return publicUrlData.publicUrl;
};

export const generateEmbeddings = async (
  textChunks: string[], 
  documentId: string, 
  clientId: string,
  metadata: any = {}
): Promise<any> => {
  try {
    // Call the Edge Function to generate embeddings
    const response = await fetch('/functions/v1/generate-embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
      },
      body: JSON.stringify({
        texts: textChunks,
        documentId,
        clientId,
        metadata
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error generating embeddings: ${error.error || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error calling generate-embeddings function:", error);
    throw error;
  }
};

// Helper function to get PDF preview URL
export const getPdfPreviewUrl = (pdfUrl: string): string => {
  // You can customize this to work with different PDF preview services
  // For now, we'll just return the direct PDF URL
  return pdfUrl;
};
