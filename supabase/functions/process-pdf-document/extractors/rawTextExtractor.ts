
// Raw text scanning extractor
import { cleanPdfTextEnhanced, isValidTextContent, calculateEnhancedQuality } from '../utils/textUtils.ts';

export async function extractFromRawText(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData);
  
  console.log('🔍 Raw text scanning for readable content...');
  
  const extractedParts: string[] = [];
  
  // Find sequences of readable text (more aggressive approach)
  const readableTextPatterns = [
    // Words with spaces (legal document patterns)
    /\b[A-Z][A-Z\s]{10,}\b/g,  // Uppercase sequences like "REQUEST FOR PRODUCTION"
    /\b[A-Za-z]+(?:\s+[A-Za-z]+){3,}\b/g,  // Multiple words together
    /[A-Z][a-z]+(?:\s+[A-Za-z]+){2,}/g,  // Sentence-like patterns
    
    // Legal document specific patterns
    /REQUEST\s+FOR\s+PRODUCTION[^.]*\./gi,
    /DISCOVERY[^.]*\./gi,
    /INTERROGATORY[^.]*\./gi,
    /TO:\s*[^.]*\./gi,
    /FROM:\s*[^.]*\./gi,
    /RE:\s*[^.]*\./gi,
    /CASE\s+NO[^.]*\./gi,
    
    // Date patterns
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    /\b[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\b/g,
    
    // Address patterns
    /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd)\b/gi
  ];
  
  console.log(`Scanning with ${readableTextPatterns.length} readable text patterns...`);
  
  for (let i = 0; i < readableTextPatterns.length; i++) {
    const pattern = readableTextPatterns[i];
    const matches = pdfString.match(pattern);
    
    if (matches) {
      console.log(`Pattern ${i + 1} found ${matches.length} matches`);
      for (const match of matches.slice(0, 20)) {
        const cleanText = cleanPdfTextEnhanced(match);
        if (cleanText && cleanText.length > 5 && isValidTextContent(cleanText)) {
          console.log(`  Found: "${cleanText.substring(0, 50)}..."`);
          extractedParts.push(cleanText);
        }
      }
    }
  }
  
  const combinedText = extractedParts.join(' ').trim();
  const pageCount = structure?.pages || 1;
  const quality = calculateEnhancedQuality(combinedText);
  
  console.log(`Raw text scanning complete: ${combinedText.length} chars, quality: ${quality}`);
  
  return {
    text: combinedText,
    method: 'raw-text-scanning',
    quality: quality,
    confidence: quality > 0.2 ? 0.7 : 0.4,
    pageCount: pageCount
  };
}
