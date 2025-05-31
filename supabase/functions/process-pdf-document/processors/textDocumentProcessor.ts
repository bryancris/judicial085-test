
// Text document processor

import { DocumentExtractionResult } from '../services/unifiedDocumentProcessor.ts';

export async function processTextDocument(textData: Uint8Array, fileName: string): Promise<DocumentExtractionResult> {
  console.log('📄 Processing text document...');
  
  try {
    // Try UTF-8 first
    let text = new TextDecoder('utf-8').decode(textData);
    
    // If UTF-8 fails, try other encodings
    if (text.includes('�')) {
      console.log('⚠️ UTF-8 decoding issues, trying alternative encodings...');
      text = new TextDecoder('latin1').decode(textData);
    }
    
    text = text.trim();
    
    if (text.length < 10) {
      throw new Error('Text file is empty or too short');
    }
    
    console.log(`✅ Text extraction completed: ${text.length} characters`);
    
    return {
      text: text,
      method: 'text-file-processing',
      quality: 0.95, // High quality for plain text
      confidence: 0.99, // Very high confidence for text files
      fileType: 'txt',
      processingNotes: `Text file processing: ${text.length} characters extracted`
    };
    
  } catch (error) {
    throw new Error(`Text file processing failed: ${error.message}`);
  }
}
