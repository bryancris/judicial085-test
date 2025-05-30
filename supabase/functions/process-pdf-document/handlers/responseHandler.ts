
import { corsHeaders } from '../corsUtils.ts';

export interface ProcessingResult {
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
  isScanned: boolean;
  processingNotes: string;
}

export function createSuccessResponse(
  documentId: string,
  chunks: string[],
  extractionResult: ProcessingResult,
  fileName: string
) {
  console.log(`🎉 === WORKING PDF PROCESSING COMPLETED SUCCESSFULLY ===`);

  return new Response(JSON.stringify({ 
    success: true, 
    documentId,
    chunksCreated: chunks.length,
    textLength: extractionResult.text.length,
    textPreview: extractionResult.text.substring(0, 500),
    extractionMethod: extractionResult.method,
    quality: extractionResult.quality,
    confidence: extractionResult.confidence,
    pageCount: extractionResult.pageCount,
    isScanned: extractionResult.isScanned,
    processingNotes: extractionResult.processingNotes,
    message: 'PDF processed successfully with WORKING extraction system',
    processingVersion: '8.0-working-system',
    readyForAnalysis: true,
    extractionValidated: true,
    workingSystem: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function createErrorResponse(error: any, documentId: string | null) {
  console.error('❌ === WORKING PDF PROCESSING FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  return new Response(JSON.stringify({ 
    success: false, 
    error: error.message || 'WORKING PDF processing failed',
    details: `Processing failed with working system v8.0: ${error.message}`,
    documentId: documentId,
    timestamp: new Date().toISOString(),
    processingVersion: '8.0-working-system'
  }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
