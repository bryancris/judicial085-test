
// Stream-based extractor with decompression
import { cleanPdfTextEnhanced, isValidTextContent, calculateEnhancedQuality } from '../utils/textUtils.ts';
import { parseTextCommandsEnhanced, extractTextFromStream, decodeASCII85, decodeASCIIHex } from '../utils/streamUtils.ts';

export async function extractFromStreamsEnhanced(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData);
  
  console.log('🔍 Enhanced stream extraction with decompression...');
  
  const extractedParts: string[] = [];
  
  // Find all stream objects
  const streamRegex = /(\d+\s+\d+\s+obj[\s\S]*?)stream\s*([\s\S]*?)\s*endstream/gi;
  let match;
  
  while ((match = streamRegex.exec(pdfString)) !== null && extractedParts.length < 100) {
    const objHeader = match[1];
    const streamData = match[2];
    
    console.log(`Processing stream object (${streamData.length} bytes)...`);
    
    // Skip obvious metadata streams
    if (objHeader.includes('/XRef') || objHeader.includes('/Metadata') || 
        objHeader.includes('/OCProperties') || streamData.length < 20) {
      continue;
    }
    
    try {
      // Try different decompression/decoding methods
      let decodedText = '';
      
      // Method 1: Try ASCII85 decode if indicated
      if (objHeader.includes('/ASCII85Decode')) {
        decodedText = decodeASCII85(streamData);
      }
      // Method 2: Try ASCIIHex decode if indicated
      else if (objHeader.includes('/ASCIIHexDecode')) {
        decodedText = decodeASCIIHex(streamData);
      }
      // Method 3: Try raw text extraction from stream
      else {
        decodedText = extractTextFromStream(streamData);
      }
      
      if (decodedText && decodedText.length > 5) {
        console.log(`  Decoded stream text: "${decodedText.substring(0, 100)}..."`);
        
        // Extract text using enhanced patterns
        const textFromStream = parseTextCommandsEnhanced(decodedText);
        if (textFromStream && textFromStream.length > 3) {
          extractedParts.push(textFromStream);
        }
      }
    } catch (error) {
      console.log(`  Stream processing failed: ${error.message}`);
      continue;
    }
  }
  
  const combinedText = extractedParts.join(' ').trim();
  const pageCount = structure?.pages || 1;
  const quality = calculateEnhancedQuality(combinedText);
  
  console.log(`Enhanced stream extraction complete: ${combinedText.length} chars, quality: ${quality}`);
  
  return {
    text: combinedText,
    method: 'enhanced-streams',
    quality: quality,
    confidence: quality > 0.3 ? 0.8 : 0.5,
    pageCount: pageCount
  };
}
