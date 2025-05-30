
// Enhanced PDF Library Service - Using actual pdf-parse library
import * as pdfParse from 'npm:pdf-parse@1.1.1';

export async function extractTextWithLibrary(pdfData: Uint8Array): Promise<{text: string, pageCount: number}> {
  console.log('📄 Starting pdf-parse library extraction...');
  
  try {
    // Convert Uint8Array to Buffer for pdf-parse
    const buffer = Buffer.from(pdfData);
    console.log(`Processing PDF buffer: ${buffer.length} bytes`);
    
    // Use pdf-parse library for proper text extraction
    const data = await pdfParse(buffer);
    
    const extractedText = data.text || '';
    const pageCount = data.numpages || 1;
    
    console.log(`pdf-parse extraction results:`);
    console.log(`- Text length: ${extractedText.length} characters`);
    console.log(`- Page count: ${pageCount}`);
    console.log(`- Text preview: "${extractedText.substring(0, 200)}..."`);
    
    if (extractedText.length > 50) {
      console.log('✅ pdf-parse extraction successful');
      return {
        text: cleanExtractedText(extractedText),
        pageCount: pageCount
      };
    } else {
      console.log('❌ pdf-parse extracted very little text');
      return {
        text: extractedText,
        pageCount: pageCount
      };
    }
    
  } catch (error) {
    console.error('❌ pdf-parse extraction failed:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

// Clean the extracted text
function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Add proper line breaks after sentences
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    // Clean up any weird characters
    .replace(/[^\x20-\x7E\s\n]/g, ' ')
    .trim();
}

// Validate library extraction quality
export function validateLibraryExtraction(text: string, pageCount: number): {isValid: boolean, quality: number, issues: string[]} {
  const issues: string[] = [];
  let quality = 1.0;
  
  // Check text length
  if (text.length < 100) {
    issues.push('Extracted text is very short');
    quality -= 0.3;
  }
  
  // Check for meaningful content
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word)
  );
  
  const meaningfulRatio = words.length > 0 ? meaningfulWords.length / words.length : 0;
  
  if (meaningfulRatio < 0.4) {
    issues.push('Low ratio of meaningful words');
    quality -= 0.2;
  }
  
  // Check for legal document indicators
  const legalTerms = ['discovery', 'request', 'court', 'case', 'legal', 'motion', 'brief', 'demand', 'dtpa', 'attorney'];
  const hasLegalTerms = legalTerms.some(term => 
    text.toLowerCase().includes(term)
  );
  
  if (hasLegalTerms) {
    quality += 0.1; // Bonus for legal content
    console.log('✅ Legal document content detected');
  }
  
  const isValid = quality > 0.3 && text.length > 50;
  
  console.log(`Validation results: isValid=${isValid}, quality=${quality}, issues=${issues.length}`);
  
  return {
    isValid,
    quality: Math.max(0, Math.min(1, quality)),
    issues
  };
}
