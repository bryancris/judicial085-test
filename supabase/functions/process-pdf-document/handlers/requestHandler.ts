
import { ProcessPdfRequest } from '../types.ts';

export function validateRequest(requestBody: any): ProcessPdfRequest {
  const { documentId, clientId, caseId, title, fileUrl, fileName, userId, firmId } = requestBody;
  
  // Log the received request for debugging
  console.log('📋 Detailed request validation:', JSON.stringify({
    documentId: documentId || 'MISSING',
    clientId: clientId || 'NULL',
    caseId: caseId || 'NULL', 
    title: title || 'MISSING',
    fileUrl: fileUrl || 'MISSING',
    fileName: fileName || 'MISSING',
    userId: userId || 'MISSING',
    firmId: firmId || 'NULL'
  }, null, 2));
  
  // Check required fields
  const missingFields = [];
  if (!documentId) missingFields.push('documentId');
  if (!fileUrl) missingFields.push('fileUrl');
  if (!fileName) missingFields.push('fileName');
  
  // For firm documents, clientId can be null, but we need either clientId or userId
  if (!clientId && !userId) {
    missingFields.push('clientId or userId');
  }
  
  if (missingFields.length > 0) {
    const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
    console.error('❌ Validation failed:', errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log('✅ Request validation passed');
  return { documentId, clientId, caseId, title, fileUrl, fileName, userId, firmId };
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
