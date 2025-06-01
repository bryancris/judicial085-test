
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
  
  // Get existing document to preserve URL throughout the process
  const { data: existingDoc } = await supabase
    .from('document_metadata')
    .select('url')
    .eq('id', documentId)
    .single();
  
  const preservedUrl = existingDoc?.url;
  
  try {
    // Update status to processing while preserving URL
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
    
    // Final status update to completed while preserving URL
    const finalUpdateData: any = {
      processing_status: 'completed',
      processed_at: new Date().toISOString(),
      processing_notes: 'Successfully processed with advanced library and OCR extraction strategy'
    };
    
    // CRITICAL: Preserve the URL that was set initially
    if (preservedUrl) {
      finalUpdateData.url = preservedUrl;
      console.log(`Preserving original URL: ${preservedUrl}`);
    }
    
    const { error: finalError } = await supabase
      .from('document_metadata')
      .update(finalUpdateData)
      .eq('id', documentId);
    
    if (finalError) {
      console.error('Failed to update final document status:', finalError);
      throw finalError;
    }
    
    console.log(`Document ${documentId} status updated to: completed (URL preserved: ${!!preservedUrl})`);
    
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
