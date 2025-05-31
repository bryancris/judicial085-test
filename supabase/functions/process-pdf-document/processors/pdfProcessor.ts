
// Main PDF processor that orchestrates the extraction and processing pipeline

import { extractTextFromPdfAdvanced } from '../advancedPdfProcessor.ts';
import { chunkDocumentAdvanced } from '../utils/chunkingUtils.ts';
import { generateAndStoreEmbeddings } from '../databaseService.ts';
import { updateDocumentStatus } from '../databaseService.ts';

export async function processPdfDocument(
  pdfData: Uint8Array,
  documentId: string,
  clientId: string,
  caseId: string | null,
  fileName: string,
  fileUrl: string,
  supabase: any,
  openaiApiKey: string
): Promise<{
  extractionResult: any;
  chunks: string[];
}> {
  console.log('🔍 === STARTING UNIFIED DOCUMENT EXTRACTION ===');
  
  try {
    // Update status to processing
    await updateDocumentStatus(documentId, 'processing', supabase);
    
    // Extract text using our working pdf-parse implementation
    const extractionResult = await extractTextFromPdfAdvanced(pdfData, fileName);
    
    console.log(`✅ Unified extraction completed: {
  method: "${extractionResult.method}",
  textLength: ${extractionResult.text.length},
  quality: ${extractionResult.quality},
  confidence: ${extractionResult.confidence},
  pageCount: ${extractionResult.pageCount},
  isScanned: ${extractionResult.isScanned},
  processingNotes: '${extractionResult.processingNotes}'
}`);
    
    // Chunk the document for embedding generation
    console.log('📂 === STARTING DOCUMENT CHUNKING ===');
    const chunks = chunkDocumentAdvanced(extractionResult.text);
    console.log(`✅ Chunking completed: ${chunks.length} chunks created`);
    
    // Generate embeddings and store in database
    console.log('🧠 === STARTING EMBEDDING GENERATION ===');
    await generateAndStoreEmbeddings(
      chunks,
      documentId,
      clientId,
      caseId,
      supabase,
      openaiApiKey,
      {
        fileName,
        fileUrl,
        extractionMethod: extractionResult.method,
        quality: extractionResult.quality,
        confidence: extractionResult.confidence,
        pageCount: extractionResult.pageCount
      }
    );
    
    // Update document status to completed
    await updateDocumentStatus(documentId, 'completed', supabase);
    console.log(`Document ${documentId} status updated to: completed`);
    
    console.log('🎉 === WORKING PDF PROCESSING COMPLETED SUCCESSFULLY ===');
    
    return {
      extractionResult,
      chunks
    };
    
  } catch (error) {
    console.error('❌ PDF processing pipeline failed:', error);
    throw error;
  }
}
