
// Enhanced Text Object Extractor
import { cleanPdfTextEnhanced, isValidTextContent, calculateEnhancedQuality } from '../utils/textUtils.ts';

export async function extractFromTextObjectsEnhanced(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  const decoder = new TextDecoder('latin1');
  const pdfString = decoder.decode(pdfData);
  
  console.log('🔍 Enhanced text object extraction with comprehensive patterns...');
  
  const extractedText: string[] = [];
  
  // COMPREHENSIVE text extraction patterns
  const textPatterns = [
    // Standard text show operators
    /BT\s+.*?\((.*?)\)\s*Tj.*?ET/gis,
    /\((.*?)\)\s*Tj/gi,
    /\((.*?)\)\s*TJ/gi,
    /\((.*?)\)\s*'/gi,
    /\((.*?)\)\s*"/gi,
    
    // Text arrays and positioning
    /TJ\s*\[\s*\((.*?)\)\s*\]/gi,
    /Td\s*\((.*?)\)\s*Tj/gi,
    /TD\s*\((.*?)\)\s*Tj/gi,
    /Tm\s+[\d\.\-\s]+\((.*?)\)\s*Tj/gi,
    
    // Font definitions with text
    /\/F\d+\s+[\d\.]+\s+Tf\s*\((.*?)\)\s*Tj/gi,
    /\/F\d+\s+[\d\.]+\s+Tf\s*.*?\((.*?)\)/gi,
    
    // Text with positioning and spacing
    /[\d\.\-\s]+\s+Td\s*\((.*?)\)/gi,
    /[\d\.\-\s]+\s+TD\s*\((.*?)\)/gi,
    
    // Quoted text patterns
    /"([^"]{3,})"/gi,
    /'([^']{3,})'/gi,
    
    // Raw parenthetical text (broader)
    /\(([^)]{5,})\)/gi
  ];
  
  console.log(`Trying ${textPatterns.length} different text extraction patterns...`);
  
  for (let i = 0; i < textPatterns.length; i++) {
    const pattern = textPatterns[i];
    console.log(`Pattern ${i + 1}: ${pattern.toString()}`);
    
    let match;
    let patternMatches = 0;
    while ((match = pattern.exec(pdfString)) !== null && extractedText.length < 200) {
      const text = cleanPdfTextEnhanced(match[1]);
      
      if (text && text.length > 2 && isValidTextContent(text)) {
        console.log(`  Found: "${text.substring(0, 50)}..."`);
        extractedText.push(text);
        patternMatches++;
      }
    }
    console.log(`Pattern ${i + 1} found ${patternMatches} matches`);
    
    // Reset regex lastIndex
    pattern.lastIndex = 0;
  }
  
  const combinedText = extractedText.join(' ').trim();
  const pageCount = structure?.pages || 1;
  const quality = calculateEnhancedQuality(combinedText);
  
  console.log(`Enhanced text object extraction complete: ${combinedText.length} chars, quality: ${quality}`);
  
  return {
    text: combinedText,
    method: 'enhanced-text-objects',
    quality: quality,
    confidence: quality > 0.3 ? 0.85 : 0.6,
    pageCount: pageCount
  };
}
