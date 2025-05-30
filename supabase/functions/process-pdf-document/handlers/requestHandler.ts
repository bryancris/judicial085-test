
import { ProcessPdfRequest } from '../types.ts';

export function validateRequest(requestBody: any): ProcessPdfRequest {
  const { documentId, clientId, caseId, title, fileUrl, fileName } = requestBody;
  
  if (!documentId || !clientId || !fileUrl || !fileName) {
    throw new Error('Missing required fields: documentId, clientId, fileUrl, or fileName');
  }
  
  return { documentId, clientId, caseId, title, fileUrl, fileName };
}

export async function downloadPdf(fileUrl: string): Promise<Uint8Array> {
  console.log(`📥 Downloading PDF from: ${fileUrl}`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  
  try {
    const downloadResponse = await fetch(fileUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Legal-AI-Working-PDF-Processor/8.0'
      }
    });
    
    clearTimeout(timeout);
    
    if (!downloadResponse.ok) {
      throw new Error(`PDF download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }
    
    const pdfArrayBuffer = await downloadResponse.arrayBuffer();
    
    if (pdfArrayBuffer.byteLength === 0) {
      throw new Error('Downloaded PDF file is empty');
    }
    
    if (pdfArrayBuffer.byteLength > 50 * 1024 * 1024) {
      throw new Error('PDF file too large (max 50MB)');
    }
    
    const pdfData = new Uint8Array(pdfArrayBuffer);
    console.log(`✅ PDF downloaded successfully: ${pdfData.length} bytes`);
    
    return pdfData;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
