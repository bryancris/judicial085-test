
// Enhanced PDF Library Service - Using PDF.js for Deno compatibility
import * as pdfjsLib from 'https://cdn.skypack.dev/pdfjs-dist@3.11.174';

export async function extractTextWithLibrary(pdfData: Uint8Array): Promise<{text: string, pageCount: number}> {
  console.log('📄 Starting PDF.js library extraction...');
  
  try {
    console.log(`Processing PDF data: ${pdfData.length} bytes`);
    
    // Use PDF.js to load and extract text from PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      console.log(`Extracting text from page ${pageNumber}/${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    const extractedText = cleanExtractedText(fullText);
    
    console.log(`PDF.js extraction results:`);
    console.log(`- Text length: ${extractedText.length} characters`);
    console.log(`- Page count: ${pdf.numPages}`);
    console.log(`- Text preview: "${extractedText.substring(0, 200)}..."`);
    
    if (extractedText.length > 50) {
      console.log('✅ PDF.js extraction successful');
      return {
        text: extractedText,
        pageCount: pdf.numPages
      };
    } else {
      console.log('❌ PDF.js extracted very little text');
      return {
        text: extractedText,
        pageCount: pdf.numPages
      };
    }
    
  } catch (error) {
    console.error('❌ PDF.js extraction failed:', error);
    throw new Error(`PDF.js parsing failed: ${error.message}`);
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
