// Mistral OCR service for direct PDF processing
// Optimized for fast, accurate document text extraction

export interface MistralOcrResult {
  text: string;
  confidence: number;
  quality: number;
  processingTime: number;
  method: string;
  notes?: string;
}

export async function extractTextWithMistralOcr(
  pdfData: Uint8Array, 
  fileName: string,
  timeoutMs: number = 15000
): Promise<MistralOcrResult> {
  const startTime = Date.now();
  
  console.log(`🤖 Starting Mistral OCR processing for ${fileName}...`);
  console.log(`⏱️ Using timeout: ${timeoutMs}ms for ${Math.round(pdfData.length / 1024)}KB file`);

  try {
    // Convert PDF to images first using PDF.js
    console.log('📄 Converting PDF to images for Mistral OCR...');
    const { renderPdfToImages } = await import('./pdfToImageService.ts');
    const images = await renderPdfToImages(pdfData);
    
    if (!images || images.length === 0) {
      throw new Error('Failed to convert PDF to images');
    }
    
    console.log(`✅ Converted PDF to ${images.length} images`);

    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      throw new Error("MISTRAL_API_KEY not configured");
    }

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏰ Mistral OCR timeout after ${timeoutMs}ms`);
    }, timeoutMs);

    // Process first few pages (limit to avoid timeouts)
    const maxPages = Math.min(images.length, 3);
    console.log(`📊 Processing ${maxPages} pages with Mistral OCR`);
    
    let allText = '';
    
    for (let i = 0; i < maxPages; i++) {
      console.log(`🖼️ Processing page ${i + 1}/${maxPages}...`);
      
      // Prepare Mistral OCR request for this page
      const requestPayload = {
        model: "pixtral-large-latest",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all text from this document page. Return only the text content in a clean, readable format preserving the document structure. Focus on accuracy and completeness. Do not include any commentary or explanations, just the extracted text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${images[i]}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      };

      console.log(`🚀 Sending page ${i + 1} to Mistral OCR API...`);

      // Make API request with timeout protection
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mistralApiKey}`
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Mistral API error for page ${i + 1}: ${response.status} ${response.statusText}`);
        console.error(`Error details: ${errorText}`);
        throw new Error(`Mistral OCR API failed for page ${i + 1}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      const pageText = result.choices?.[0]?.message?.content || "";
      
      if (pageText && pageText.length > 5) {
        allText += (allText ? '\n\n' : '') + `--- Page ${i + 1} ---\n${pageText}`;
        console.log(`✅ Extracted ${pageText.length} characters from page ${i + 1}`);
      }
    }

    clearTimeout(timeoutId);
    
    if (!allText || allText.length < 10) {
      throw new Error("Mistral OCR returned insufficient text content");
    }

    const processingTime = Date.now() - startTime;
    const quality = calculateTextQuality(allText);
    const confidence = Math.min(0.95, quality * 1.1); // Mistral typically has high confidence

    console.log(`✅ Mistral OCR completed successfully:`);
    console.log(`- Processing time: ${processingTime}ms`);
    console.log(`- Text length: ${allText.length} characters`);
    console.log(`- Pages processed: ${maxPages}`);
    console.log(`- Quality score: ${quality.toFixed(2)}`);
    console.log(`- Confidence: ${confidence.toFixed(2)}`);

    return {
      text: allText,
      confidence,
      quality,
      processingTime,
      method: "mistral-ocr",
      notes: `Successfully processed ${maxPages} pages (${Math.round(pdfData.length / 1024)}KB PDF) in ${processingTime}ms using Mistral OCR`
    };

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    if (error.name === 'AbortError') {
      console.error(`⏰ Mistral OCR timeout after ${timeoutMs}ms`);
      throw new Error(`Mistral OCR request timed out after ${timeoutMs}ms`);
    }
    
    console.error(`❌ Mistral OCR processing failed: ${error.message}`);
    throw new Error(`Mistral OCR failed: ${error.message}`);
  }
}

// Calculate text quality based on content analysis
function calculateTextQuality(text: string): number {
  if (!text || text.length < 10) {
    return 0.0;
  }

  const words = text.split(/\s+/).filter(word => word.length > 0);
  const totalChars = text.length;
  
  // Basic quality metrics
  const wordCount = words.length;
  const avgWordLength = wordCount > 0 ? words.reduce((sum, word) => sum + word.length, 0) / wordCount : 0;
  const alphabeticRatio = (text.match(/[a-zA-Z]/g) || []).length / totalChars;
  const whitespaceRatio = (text.match(/\s/g) || []).length / totalChars;
  
  // Quality indicators
  const hasReasonableWordLength = avgWordLength > 2 && avgWordLength < 15;
  const hasGoodAlphabeticContent = alphabeticRatio > 0.6;
  const hasReasonableWhitespace = whitespaceRatio > 0.1 && whitespaceRatio < 0.4;
  const hasMinimumLength = totalChars > 50;
  
  // Calculate quality score
  let quality = 0.5; // Base quality
  
  if (hasMinimumLength) quality += 0.2;
  if (hasReasonableWordLength) quality += 0.15;
  if (hasGoodAlphabeticContent) quality += 0.15;
  if (hasReasonableWhitespace) quality += 0.1;
  
  // Bonus for legal document indicators
  const legalTerms = ['contract', 'agreement', 'clause', 'section', 'party', 'liability', 'terms', 'conditions'];
  const hasLegalContent = legalTerms.some(term => text.toLowerCase().includes(term));
  if (hasLegalContent) {
    quality += 0.1;
    console.log(`✅ Legal document content detected - boosting quality`);
  }
  
  return Math.min(1.0, Math.max(0.1, quality));
}

// Calculate dynamic timeout based on file size
export function calculateMistralTimeout(fileSizeBytes: number): number {
  const fileSizeKB = fileSizeBytes / 1024;
  
  // Mistral OCR is much faster than Gemini Vision
  // Base timeout: 10 seconds
  // Additional time: 50ms per KB (much less than Gemini)
  const baseTimeout = 10000; // 10 seconds
  const additionalTime = Math.floor(fileSizeKB * 50); // 50ms per KB
  const maxTimeout = 20000; // 20 seconds max
  
  const timeout = Math.min(maxTimeout, baseTimeout + additionalTime);
  
  console.log(`⏱️ Calculated Mistral OCR timeout: ${timeout}ms for ${Math.round(fileSizeKB)}KB file`);
  return timeout;
}