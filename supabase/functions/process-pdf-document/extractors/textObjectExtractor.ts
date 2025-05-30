
// Enhanced text object extractor with optimized patterns and timeout controls

export async function extractFromTextObjectsEnhanced(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('🔍 Enhanced text object extraction with optimized patterns...');
  
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    // Optimized extraction patterns with timeout protection
    const extractedTexts: string[] = [];
    const maxProcessingTime = 8000; // 8 seconds max
    const startTime = Date.now();
    
    // More efficient patterns that won't cause infinite loops
    const optimizedPatterns = [
      // Basic text objects - most common
      /BT\s+.*?\((.*?)\)\s*Tj.*?ET/gis,
      /\((.*?)\)\s*Tj/gi,
      /\((.*?)\)\s*TJ/gi,
      
      // Text positioning with content
      /Td\s*\((.*?)\)\s*Tj/gi,
      /TD\s*\((.*?)\)\s*Tj/gi,
      
      // Font and text combinations
      /\/F\d+\s+[\d\.]+\s+Tf\s*\((.*?)\)\s*Tj/gi,
      
      // Array-based text
      /TJ\s*\[\s*\((.*?)\)\s*\]/gi,
      
      // Simple parenthetical content
      /\((.*?)\)/gi
    ];
    
    for (let i = 0; i < optimizedPatterns.length; i++) {
      // Check timeout
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`⏰ Timeout reached, stopping at pattern ${i + 1}`);
        break;
      }
      
      const pattern = optimizedPatterns[i];
      console.log(`Pattern ${i + 1}: ${pattern.toString()}`);
      
      try {
        // Use matchAll with limited iterations to prevent infinite loops
        const matches = Array.from(pdfString.matchAll(pattern)).slice(0, 1000); // Limit matches
        console.log(`Pattern ${i + 1} found ${matches.length} matches`);
        
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 0) {
            const cleanText = cleanExtractedText(match[1]);
            if (cleanText.length > 2) {
              extractedTexts.push(cleanText);
            }
          }
          
          // Break if we have enough content or timeout approaching
          if (extractedTexts.length > 500 || Date.now() - startTime > maxProcessingTime - 1000) {
            break;
          }
        }
        
        // If we found substantial content, we can stop early
        if (extractedTexts.length > 100) {
          console.log(`✅ Found sufficient content (${extractedTexts.length} texts), stopping early`);
          break;
        }
        
      } catch (patternError) {
        console.warn(`Pattern ${i + 1} error:`, patternError.message);
        continue;
      }
    }
    
    const combinedText = extractedTexts.join(' ').trim();
    const quality = calculateTextQuality(combinedText);
    
    console.log(`✅ Text object extraction completed: ${combinedText.length} chars, quality: ${quality}`);
    
    return {
      text: combinedText,
      method: 'enhanced-text-objects',
      quality: quality,
      confidence: quality > 0.3 ? 0.8 : 0.4,
      pageCount: structure.pages || 1
    };
    
  } catch (error) {
    console.error('❌ Text object extraction failed:', error);
    return {
      text: '',
      method: 'enhanced-text-objects-failed',
      quality: 0,
      confidence: 0,
      pageCount: 1
    };
  }
}

// Optimized text cleaning function
function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  try {
    return text
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    return text.trim();
  }
}

// Fast quality calculation
function calculateTextQuality(text: string): number {
  if (!text || text.length < 10) return 0;
  
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  const ratio = meaningfulWords.length / Math.max(words.length, 1);
  const lengthScore = Math.min(text.length / 500, 1);
  
  return Math.min(ratio * 0.7 + lengthScore * 0.3, 1);
}
