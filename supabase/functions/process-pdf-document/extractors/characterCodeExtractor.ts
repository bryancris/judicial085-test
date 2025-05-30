
// Character code extractor with timeout protection

export async function extractFromCharacterCodes(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('🔍 Character code extraction with timeout protection...');
  
  try {
    const maxProcessingTime = 3000; // 3 seconds max
    const startTime = Date.now();
    
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Look for character codes and hex values efficiently
    const extractedChars: string[] = [];
    
    // Simple approach - look for sequences of printable characters
    for (let i = 0; i < Math.min(pdfString.length, 50000); i++) {
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('⏰ Character code extraction timeout reached');
        break;
      }
      
      const char = pdfString[i];
      const code = char.charCodeAt(0);
      
      // Include printable ASCII characters
      if (code >= 32 && code <= 126) {
        extractedChars.push(char);
      }
      
      // Limit processing
      if (extractedChars.length > 5000) break;
    }
    
    const combinedText = extractedChars.join('').replace(/\s+/g, ' ').trim();
    const quality = combinedText.length > 100 ? 0.2 : 0.05;
    
    console.log(`✅ Character code extraction completed: ${combinedText.length} chars`);
    
    return {
      text: combinedText,
      method: 'character-codes',
      quality: quality,
      confidence: quality > 0.15 ? 0.4 : 0.1,
      pageCount: structure.pages || 1
    };
    
  } catch (error) {
    console.error('❌ Character code extraction failed:', error);
    return {
      text: '',
      method: 'character-codes-failed',
      quality: 0,
      confidence: 0,
      pageCount: 1
    };
  }
}
