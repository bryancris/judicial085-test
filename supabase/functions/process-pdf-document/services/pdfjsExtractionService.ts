
// Deno-compatible PDF.js extraction service (without workers)

export async function extractTextWithPdfJs(pdfData: Uint8Array): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('📄 Starting PDF.js text extraction (Deno-compatible)...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Import PDF.js for Deno environment
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.8.69/build/pdf.mjs');
    
    // Configure PDF.js to work without workers in Deno
    pdfjsLib.GlobalWorkerOptions.workerSrc = null;
    
    console.log('🔍 Loading PDF document with PDF.js...');
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;
    
    console.log(`✅ PDF loaded successfully: ${pageCount} pages`);
    
    // Extract text from all pages
    const textPages: string[] = [];
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items into readable text
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .trim();
        
        if (pageText.length > 0) {
          textPages.push(pageText);
          console.log(`Page ${pageNum}: ${pageText.length} characters extracted`);
        }
      } catch (pageError) {
        console.warn(`Warning: Failed to extract text from page ${pageNum}:`, pageError);
      }
    }
    
    // Combine all pages
    const extractedText = textPages.join('\n\n').trim();
    
    console.log(`✅ PDF.js extraction completed: ${extractedText.length} characters from ${pageCount} pages`);
    
    if (extractedText.length < 20) {
      throw new Error('PDF.js extraction produced insufficient content');
    }
    
    // Calculate quality metrics
    const quality = calculatePdfJsQuality(extractedText, pageCount);
    const confidence = Math.min(0.92, quality + 0.15); // Good confidence for PDF.js
    
    return {
      text: extractedText,
      method: 'pdfjs-deno-compatible',
      quality: quality,
      confidence: confidence,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ PDF.js extraction failed:', error);
    throw new Error(`PDF.js extraction failed: ${error.message}`);
  }
}

// Calculate extraction quality for PDF.js results
function calculatePdfJsQuality(text: string, pageCount: number): number {
  if (!text || text.length < 10) return 0.1;
  
  let quality = 0.80; // Good base quality for PDF.js
  
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
    'PURSUANT', 'VIOLATION', 'DAMAGES', 'DTPA', 'DEMAND', 'NOTICE', 'HOA'
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
  
  return Math.max(0.1, Math.min(0.95, quality));
}

// Validate PDF.js extraction results
export function validatePdfJsExtraction(text: string, pageCount: number): {
  isValid: boolean;
  quality: number;
  issues: string[];
} {
  const issues: string[] = [];
  const quality = calculatePdfJsQuality(text, pageCount);
  
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
  
  console.log(`PDF.js validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality,
    issues
  };
}
