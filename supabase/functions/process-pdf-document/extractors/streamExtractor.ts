
// Enhanced stream extractor with timeout controls

export async function extractFromStreamsEnhanced(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('🔍 Enhanced stream extraction with timeout controls...');
  
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    const maxProcessingTime = 5000; // 5 seconds max for stream processing
    const startTime = Date.now();
    
    // Find streams more efficiently
    const streamPattern = /stream\s*(.*?)\s*endstream/gis;
    const streams = Array.from(pdfString.matchAll(streamPattern)).slice(0, 50); // Limit streams
    
    console.log(`Found ${streams.length} streams to process`);
    
    const extractedTexts: string[] = [];
    
    for (let i = 0; i < streams.length; i++) {
      // Check timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`⏰ Stream processing timeout reached at stream ${i + 1}`);
        break;
      }
      
      try {
        const streamContent = streams[i][1];
        if (!streamContent || streamContent.length < 10) continue;
        
        // Try to decompress if it looks like flate
        let processedContent = streamContent;
        
        // Simple text extraction from stream
        const textMatches = streamContent.match(/\((.*?)\)/g);
        if (textMatches && textMatches.length > 0) {
          for (const match of textMatches.slice(0, 100)) { // Limit matches per stream
            const cleanText = match.replace(/[()]/g, '').trim();
            if (cleanText.length > 2) {
              extractedTexts.push(cleanText);
            }
          }
        }
        
        // Look for readable text patterns
        const readableText = streamContent.match(/[A-Za-z]{3,}/g);
        if (readableText && readableText.length > 5) {
          extractedTexts.push(...readableText.slice(0, 50));
        }
        
      } catch (streamError) {
        console.warn(`Stream ${i + 1} processing error:`, streamError.message);
        continue;
      }
    }
    
    const combinedText = extractedTexts.join(' ').trim();
    const quality = calculateStreamQuality(combinedText);
    
    console.log(`✅ Stream extraction completed: ${combinedText.length} chars, quality: ${quality}`);
    
    return {
      text: combinedText,
      method: 'enhanced-streams',
      quality: quality,
      confidence: quality > 0.25 ? 0.7 : 0.3,
      pageCount: structure.pages || 1
    };
    
  } catch (error) {
    console.error('❌ Stream extraction failed:', error);
    return {
      text: '',
      method: 'enhanced-streams-failed',
      quality: 0,
      confidence: 0,
      pageCount: 1
    };
  }
}

function calculateStreamQuality(text: string): number {
  if (!text || text.length < 20) return 0;
  
  const words = text.split(/\s+/);
  const validWords = words.filter(word => 
    word.length > 2 && /^[a-zA-Z]+$/.test(word)
  );
  
  return Math.min(validWords.length / Math.max(words.length, 1), 1);
}
