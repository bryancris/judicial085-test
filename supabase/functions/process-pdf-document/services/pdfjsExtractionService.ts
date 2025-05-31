
// PDF.js-based text extraction service for reliable PDF processing

export async function extractTextWithPdfJs(pdfData: Uint8Array): Promise<{
  text: string;
  pageCount: number;
  quality: number;
  confidence: number;
  method: string;
}> {
  console.log('📄 Starting PDF.js text extraction...');
  console.log(`Processing PDF: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    // Import PDF.js for server-side use
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.8.69/build/pdf.mjs');
    
    // Configure PDF.js for server-side rendering
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.8.69/build/pdf.worker.mjs';
    
    // Load the PDF document
    console.log('🔍 Loading PDF document with PDF.js...');
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: false,
      standardFontDataUrl: 'https://esm.sh/pdfjs-dist@4.8.69/web/standard_fonts/'
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    console.log(`✅ PDF loaded successfully: ${pageCount} pages`);
    
    // Extract text from all pages
    const textSegments: string[] = [];
    
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        console.log(`📖 Processing page ${pageNum}/${pageCount}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent({
          includeMarkedContent: true,
          disableNormalization: false
        });
        
        // Extract and structure text items
        const pageText = extractTextFromPdfJsContent(textContent);
        
        if (pageText && pageText.trim().length > 0) {
          textSegments.push(`--- Page ${pageNum} ---\n${pageText.trim()}`);
          console.log(`✅ Page ${pageNum}: extracted ${pageText.length} characters`);
        } else {
          console.log(`⚠️ Page ${pageNum}: no readable text found`);
        }
        
        // Clean up page resources
        page.cleanup();
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${pageNum}:`, pageError);
        textSegments.push(`--- Page ${pageNum} ---\n[Error extracting page content]`);
      }
    }
    
    // Combine all extracted text
    const combinedText = textSegments.join('\n\n').trim();
    
    if (combinedText.length < 50) {
      console.warn('⚠️ PDF.js extracted very little text');
      throw new Error('PDF.js extraction produced insufficient content');
    }
    
    console.log(`✅ PDF.js extraction completed: ${combinedText.length} total characters`);
    
    // Calculate quality metrics
    const quality = calculatePdfJsQuality(combinedText, pageCount);
    const confidence = Math.min(0.95, quality + 0.1); // High confidence for PDF.js
    
    return {
      text: combinedText,
      pageCount: pageCount,
      quality: quality,
      confidence: confidence,
      method: 'pdfjs-extraction'
    };
    
  } catch (error) {
    console.error('❌ PDF.js extraction failed:', error);
    throw new Error(`PDF.js extraction failed: ${error.message}`);
  }
}

// Extract and structure text from PDF.js text content
function extractTextFromPdfJsContent(textContent: any): string {
  if (!textContent || !textContent.items) {
    return '';
  }
  
  const textItems: string[] = [];
  let currentLine = '';
  let lastY = -1;
  
  for (const item of textContent.items) {
    if (!item.str || item.str.trim().length === 0) continue;
    
    const text = item.str;
    const y = item.transform ? item.transform[5] : 0;
    
    // Detect line breaks based on Y position changes
    if (lastY !== -1 && Math.abs(y - lastY) > 2) {
      if (currentLine.trim()) {
        textItems.push(currentLine.trim());
      }
      currentLine = text;
    } else {
      currentLine += (currentLine ? ' ' : '') + text;
    }
    
    lastY = y;
  }
  
  // Add final line
  if (currentLine.trim()) {
    textItems.push(currentLine.trim());
  }
  
  // Join lines and clean up
  return textItems
    .filter(line => line.length > 1) // Remove single character artifacts
    .join('\n')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s+/g, '\n') // Clean line breaks
    .trim();
}

// Calculate extraction quality for PDF.js results
function calculatePdfJsQuality(text: string, pageCount: number): number {
  if (!text || text.length < 20) return 0.1;
  
  let quality = 0.8; // High base quality for PDF.js
  
  // Check text length relative to pages
  const avgCharsPerPage = text.length / pageCount;
  if (avgCharsPerPage > 500) {
    quality += 0.1; // Good content density
  } else if (avgCharsPerPage < 100) {
    quality -= 0.2; // Low content density
  }
  
  // Check for structured content
  const hasStructure = (
    text.includes('\n') && 
    text.match(/[.!?]/g)?.length > 10 &&
    text.split('\n').length > 5
  );
  
  if (hasStructure) {
    quality += 0.05;
  }
  
  // Check for legal document indicators
  const legalTerms = [
    'DTPA', 'DEMAND', 'ATTORNEY', 'LAW', 'COURT', 'CASE', 'LEGAL',
    'PLAINTIFF', 'DEFENDANT', 'PURSUANT', 'VIOLATION', 'DAMAGES'
  ];
  
  const upperText = text.toUpperCase();
  const legalTermsFound = legalTerms.filter(term => upperText.includes(term));
  
  if (legalTermsFound.length > 0) {
    quality += 0.05 * Math.min(legalTermsFound.length, 3); // Boost for legal content
    console.log(`✅ Legal document indicators found: ${legalTermsFound.join(', ')}`);
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
  let quality = calculatePdfJsQuality(text, pageCount);
  
  // Check minimum content requirements
  if (text.length < 50) {
    issues.push('Extracted text is too short');
    quality = 0.1;
  }
  
  if (pageCount > 0 && text.length / pageCount < 50) {
    issues.push('Very low content per page ratio');
    quality -= 0.2;
  }
  
  // Check for meaningful words
  const words = text.split(/\s+/).filter(word => 
    word.length > 2 && /^[a-zA-Z]/.test(word)
  );
  
  if (words.length < 10) {
    issues.push('Too few meaningful words extracted');
    quality -= 0.3;
  }
  
  const isValid = quality > 0.3 && text.length > 30 && issues.length < 3;
  
  console.log(`PDF.js validation: isValid=${isValid}, quality=${quality.toFixed(2)}, issues=${issues.length}`);
  
  return {
    isValid,
    quality: Math.max(0, Math.min(1, quality)),
    issues
  };
}
