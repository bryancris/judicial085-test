
// Raw text extractor with efficient scanning

export async function extractFromRawText(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('🔍 Raw text scanning with efficient patterns...');
  
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Quick scan for readable text
    const readableTextPattern = /[A-Za-z][A-Za-z\s]{10,}/g;
    const matches = Array.from(pdfString.matchAll(readableTextPattern)).slice(0, 200);
    
    const extractedTexts: string[] = [];
    
    for (const match of matches) {
      const text = match[0].trim();
      if (text.length > 10 && !text.includes('obj') && !text.includes('endobj')) {
        extractedTexts.push(text);
      }
    }
    
    const combinedText = extractedTexts.join(' ').trim();
    const quality = combinedText.length > 50 ? 0.3 : 0.1;
    
    console.log(`✅ Raw text extraction completed: ${combinedText.length} chars`);
    
    return {
      text: combinedText,
      method: 'raw-text-scan',
      quality: quality,
      confidence: quality > 0.2 ? 0.5 : 0.2,
      pageCount: structure.pages || 1
    };
    
  } catch (error) {
    console.error('❌ Raw text extraction failed:', error);
    return {
      text: '',
      method: 'raw-text-failed',
      quality: 0,
      confidence: 0,
      pageCount: 1
    };
  }
}
