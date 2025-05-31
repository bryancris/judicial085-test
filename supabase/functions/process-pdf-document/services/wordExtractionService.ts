
// Mammoth.js-based Word document extraction service

export async function extractTextFromWord(docxData: Uint8Array): Promise<{
  text: string;
  quality: number;
  confidence: number;
  method: string;
}> {
  console.log('📄 Starting Word document extraction with mammoth.js...');
  console.log(`Processing DOCX: ${docxData.length} bytes (${Math.round(docxData.length / 1024)}KB)`);
  
  try {
    // Import mammoth for Word document processing
    const mammoth = await import('https://esm.sh/mammoth@1.6.0');
    
    // Extract text from Word document
    console.log('🔍 Extracting text from Word document...');
    const result = await mammoth.extractRawText({
      arrayBuffer: docxData.buffer
    });
    
    const extractedText = result.value.trim();
    const messages = result.messages || [];
    
    // Log any warnings or issues
    if (messages.length > 0) {
      console.log('⚠️ Mammoth.js messages:', messages.map(m => m.message).join(', '));
    }
    
    if (extractedText.length < 20) {
      throw new Error('Word extraction produced insufficient content');
    }
    
    console.log(`✅ Word extraction completed: ${extractedText.length} characters`);
    
    // Calculate quality metrics
    const quality = calculateWordQuality(extractedText, messages);
    const confidence = Math.min(0.90, quality + 0.05); // Good confidence for mammoth.js
    
    return {
      text: extractedText,
      quality: quality,
      confidence: confidence,
      method: 'mammoth-word-extraction'
    };
    
  } catch (error) {
    console.error('❌ Word extraction failed:', error);
    throw new Error(`Word document extraction failed: ${error.message}`);
  }
}

// Calculate extraction quality for Word documents
function calculateWordQuality(text: string, messages: any[]): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.85; // High base quality for mammoth.js
  
  // Reduce quality for extraction warnings
  const errorMessages = messages.filter(m => m.type === 'error');
  const warningMessages = messages.filter(m => m.type === 'warning');
  
  quality -= errorMessages.length * 0.1;
  quality -= warningMessages.length * 0.05;
  
  // Check text structure
  const paragraphs = text.split('\n').filter(p => p.trim().length > 10);
  const sentences = text.match(/[.!?]+/g) || [];
  
  if (paragraphs.length > 3 && sentences.length > 5) {
    quality += 0.05; // Well-structured document
  }
  
  // Check for legal document indicators
  const legalTerms = [
    'DTPA', 'DEMAND', 'ATTORNEY', 'LAW', 'COURT', 'CASE', 'LEGAL',
    'PLAINTIFF', 'DEFENDANT', 'PURSUANT', 'VIOLATION', 'DAMAGES'
  ];
  
  const upperText = text.toUpperCase();
  const legalTermsFound = legalTerms.filter(term => upperText.includes(term));
  
  if (legalTermsFound.length > 0) {
    quality += 0.05; // Boost for legal content
    console.log(`✅ Legal document indicators found: ${legalTermsFound.join(', ')}`);
  }
  
  return Math.max(0.1, Math.min(0.95, quality));
}

// Validate Word extraction results
export function validateWordExtraction(text: string): {
  isValid: boolean;
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  const quality = calculateWordQuality(text, []);
  
  if (text.length < 20) {
    issues.push('Extracted text is too short');
  }
  
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  if (words.length < 10) {
    issues.push('Too few meaningful words extracted');
  }
  
  const isValid = quality > 0.4 && text.length > 20;
  
  console.log(`Word validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality,
    issues
  };
}
