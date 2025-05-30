
// Character code extraction method
import { cleanPdfTextEnhanced, isValidTextContent, calculateEnhancedQuality } from '../utils/textUtils.ts';

export async function extractFromCharacterCodes(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('🔍 Character code extraction...');
  
  const extractedParts: string[] = [];
  
  // Convert bytes to character sequences
  for (let i = 0; i < pdfData.length - 10; i++) {
    let sequence = '';
    let validChars = 0;
    
    // Read up to 50 characters
    for (let j = 0; j < 50 && i + j < pdfData.length; j++) {
      const byte = pdfData[i + j];
      
      // Check for printable ASCII
      if (byte >= 32 && byte <= 126) {
        sequence += String.fromCharCode(byte);
        validChars++;
      } else if (byte === 10 || byte === 13) {
        sequence += ' '; // Convert newlines to spaces
      } else {
        break; // Stop at non-printable character
      }
    }
    
    // If we found a good sequence, save it
    if (validChars > 10 && sequence.length > 15) {
      const cleanText = cleanPdfTextEnhanced(sequence);
      if (cleanText && isValidTextContent(cleanText)) {
        extractedParts.push(cleanText);
        console.log(`  Found character sequence: "${cleanText.substring(0, 50)}..."`);
        
        if (extractedParts.length > 50) break; // Limit results
      }
    }
    
    // Skip ahead to avoid overlapping sequences
    i += Math.max(1, sequence.length / 2);
  }
  
  const combinedText = extractedParts.join(' ').trim();
  const pageCount = structure?.pages || 1;
  const quality = calculateEnhancedQuality(combinedText);
  
  console.log(`Character code extraction complete: ${combinedText.length} chars, quality: ${quality}`);
  
  return {
    text: combinedText,
    method: 'character-codes',
    quality: quality,
    confidence: quality > 0.15 ? 0.6 : 0.3,
    pageCount: pageCount
  };
}
