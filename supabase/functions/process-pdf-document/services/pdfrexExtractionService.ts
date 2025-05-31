
// Deno-native PDF extraction service using pdfrex

export async function extractTextWithPdfrex(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('📄 Starting pdfrex text extraction (Deno-native)...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Import pdfrex for Deno environment
    const { extractText, getPageCount } = await import('https://deno.land/x/pdfrex@v0.1.0/mod.ts');
    
    console.log('🔍 Extracting text with pdfrex...');
    
    // Extract text using pdfrex
    const extractedText = await extractText(pdfData);
    
    // Get page count
    let pageCount = 1;
    try {
      pageCount = await getPageCount(pdfData);
    } catch (pageError) {
      console.warn('Could not get page count, defaulting to 1:', pageError);
    }
    
    console.log(`✅ pdfrex extraction completed: ${extractedText.length} characters from ${pageCount} pages`);
    
    if (extractedText.length < 20) {
      throw new Error('pdfrex extraction produced insufficient content');
    }
    
    // Calculate quality metrics
    const quality = calculatePdfrexQuality(extractedText, pageCount);
    const confidence = Math.min(0.95, quality + 0.20); // High confidence for pdfrex
    
    return {
      text: extractedText.trim(),
      method: 'pdfrex-deno-native',
      quality: quality,
      confidence: confidence,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ pdfrex extraction failed:', error);
    throw new Error(`pdfrex extraction failed: ${error.message}`);
  }
}

// Calculate extraction quality for pdfrex results
function calculatePdfrexQuality(text: string, pageCount: number): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.85; // High base quality for pdfrex
  
  // Check text structure and content
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const sentences = text.match(/[.!?]+/g) || [];
  const paragraphs = text.split('\n').filter(p => p.trim().length > 10);
  
  // Quality boosts for well-structured content
  if (words.length > 50) quality += 0.05;
  if (sentences.length > 3) quality += 0.05;
  if (paragraphs.length > 2) quality += 0.05;
  
  // Check for legal document indicators
  const legalTerms = [
    'ATTORNEY', 'LAW', 'COURT', 'CASE', 'LEGAL', 'PLAINTIFF', 'DEFENDANT',
    'PURSUANT', 'VIOLATION', 'DAMAGES', 'DTPA', 'DEMAND', 'NOTICE', 'HOA',
    'CONTRACT', 'AGREEMENT', 'BREACH', 'LIABILITY', 'SETTLEMENT'
  ];
  
  const upperText = text.toUpperCase();
  const legalTermsFound = legalTerms.filter(term => upperText.includes(term));
  
  if (legalTermsFound.length > 0) {
    quality += 0.1; // Significant boost for legal content
    console.log(`✅ Legal document indicators found: ${legalTermsFound.join(', ')}`);
  }
  
  // Page count factor
  if (pageCount > 1) {
    quality += Math.min(pageCount * 0.02, 0.1);
  }
  
  return Math.max(0.1, Math.min(0.98, quality));
}

// Validate pdfrex extraction results
export function validatePdfrexExtraction(text: string, pageCount: number): {
  isValid: boolean;
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  const quality = calculatePdfrexQuality(text, pageCount);
  
  if (text.length < 20) {
    issues.push('Extracted text is too short');
  }
  
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  if (words.length < 10) {
    issues.push('Too few meaningful words extracted');
  }
  
  // Check for garbled text patterns
  const garbageRatio = (text.match(/[^\w\s.,!?;:()\-"']/g) || []).length / text.length;
  if (garbageRatio > 0.1) {
    issues.push('High ratio of special characters detected');
  }
  
  const isValid = quality > 0.3 && text.length > 20 && issues.length < 2;
  
  console.log(`pdfrex validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality,
    issues
  };
}
