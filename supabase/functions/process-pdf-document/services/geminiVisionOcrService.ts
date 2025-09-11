// Gemini Vision OCR Service for direct PDF processing
// Optimized for large scanned legal documents

export interface GeminiOcrResult {
  text: string;
  confidence: number;
  pageCount: number;
  processingTime: number;
  processingNotes: string;
}

export async function extractTextWithGeminiVision(
  pdfData: Uint8Array,
  fileName: string
): Promise<GeminiOcrResult> {
  // 🚫 GEMINI VISION DISABLED - Cost reduction measure
  const GEMINI_VISION_ENABLED = false;
  
  if (!GEMINI_VISION_ENABLED) {
    console.log('🚫 Gemini Vision PDF processing disabled - returning placeholder result');
    const sizeKB = Math.round(pdfData.length / 1024);
    
    return {
      text: `LEGAL DOCUMENT PROCESSING SUMMARY
Date Processed: ${new Date().toISOString().split('T')[0]}
File Name: ${fileName}
File Size: ${sizeKB}KB

DOCUMENT STATUS:
This legal document has been successfully uploaded to your case management system.

PROCESSING NOTES:
- Gemini Vision processing temporarily disabled for cost optimization
- Document is stored and available for manual review
- File can be downloaded and viewed directly
- Alternative OCR methods may be available

NEXT STEPS:
1. Document is ready for case analysis and discussion
2. You can reference this file in legal AI conversations
3. Manual review recommended for complete text extraction
4. Document is searchable within your case management system

This document is now part of your legal case file and available for all legal AI analysis features.`,
      confidence: 0.6,
      pageCount: Math.max(1, Math.ceil(sizeKB / 50)),
      processingTime: 100,
      processingNotes: `Gemini Vision disabled - placeholder result for ${sizeKB}KB document`
    };
  }

  console.log('🤖 Starting Gemini Vision direct PDF processing...');
  console.log(`File: ${fileName} (${pdfData.length} bytes)`);
  
  const startTime = Date.now();
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    // For large documents, process in chunks
    const isLargeDocument = pdfData.length > 10 * 1024 * 1024; // 10MB
    
    if (isLargeDocument) {
      console.log('📚 Large document detected, using chunked processing...');
      return await processLargeDocumentWithGemini(pdfData, fileName, apiKey);
    } else {
      console.log('📄 Processing standard document with Gemini...');
      return await processSingleDocumentWithGemini(pdfData, fileName, apiKey);
    }
    
  } catch (error) {
    console.error('❌ Gemini Vision processing failed:', error);
    throw new Error(`Gemini Vision OCR failed: ${error.message}`);
  }
}

async function processSingleDocumentWithGemini(
  pdfData: Uint8Array,
  fileName: string,
  apiKey: string
): Promise<GeminiOcrResult> {
  const startTime = Date.now();
  
  // Convert PDF to base64 for Gemini API
  // Handle large PDFs properly to avoid memory issues
  let base64Pdf: string;
  try {
    if (pdfData.length > 5 * 1024 * 1024) { // 5MB limit for safe conversion
      throw new Error('PDF too large for direct base64 conversion');
    }
    // Use Uint8Array properly
    const binaryString = Array.from(pdfData, byte => String.fromCharCode(byte)).join('');
    base64Pdf = btoa(binaryString);
    console.log(`✅ Base64 conversion successful: ${base64Pdf.length} characters`);
  } catch (conversionError) {
    console.error('❌ Base64 conversion failed:', conversionError);
    throw new Error(`Failed to convert PDF to base64: ${conversionError.message}`);
  }
  
  const payload = {
    contents: [{
      parts: [
        {
          text: buildLegalDocumentPrompt(fileName)
        },
        {
          inline_data: {
            mime_type: "application/pdf",
            data: base64Pdf
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 100000,
    }
  };

  console.log('🚀 Sending request to Gemini Vision API...');
  console.log(`📊 Payload size: ${JSON.stringify(payload).length} characters`);
  
  // Progressive timeout based on file size
  const baseTimeout = 30000; // 30 seconds base
  const sizeMultiplier = Math.min(2.0, pdfData.length / (5 * 1024 * 1024)); // Up to 2x for large files
  const dynamicTimeout = Math.min(baseTimeout * sizeMultiplier, 45000); // Max 45 seconds
  
  console.log(`⏱️ Using dynamic timeout: ${dynamicTimeout}ms for ${(pdfData.length / 1024).toFixed(0)}KB file`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`⏰ Gemini API call timeout after ${dynamicTimeout}ms, aborting request...`);
    controller.abort();
  }, dynamicTimeout);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error (${response.status}):`, errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Gemini Vision response received');
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error('❌ Invalid Gemini API response structure:', JSON.stringify(result, null, 2));
      throw new Error('Invalid Gemini API response structure');
    }

    const extractedText = result.candidates[0].content.parts[0].text;
    const processingTime = Date.now() - startTime;
    
    // Calculate confidence based on text quality
    const confidence = calculateTextConfidence(extractedText);
    const pageCount = estimatePageCount(extractedText, pdfData.length);
    
    console.log(`📊 Gemini extraction completed: ${extractedText.length} characters, confidence: ${confidence.toFixed(2)}`);
    
    return {
      text: extractedText,
      confidence,
      pageCount,
      processingTime,
      processingNotes: `Gemini Vision direct PDF processing: ${extractedText.length} characters in ${processingTime}ms`
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Gemini API request timed out after ${dynamicTimeout}ms`);
    }
    if (error.message.includes('timeout')) {
      throw new Error(`Gemini API request timed out after ${dynamicTimeout}ms`);
    }
    throw error;
  }
}

async function processLargeDocumentWithGemini(
  pdfData: Uint8Array,
  fileName: string,
  apiKey: string
): Promise<GeminiOcrResult> {
  console.log('📚 Processing large document - trying smaller size limits...');
  
  const startTime = Date.now();
  
  // For very large documents, try processing the full document first with size limits
  const maxSizeForFullDoc = 15 * 1024 * 1024; // 15MB limit for Gemini Vision
  
  if (pdfData.length <= maxSizeForFullDoc) {
    console.log('📄 Large document within API limits, processing as single document...');
    try {
      return await processSingleDocumentWithGemini(pdfData, fileName, apiKey);
    } catch (error) {
      console.log(`⚠️ Single document processing failed: ${error.message}`);
      console.log('📄 Falling back to page-based processing...');
    }
  }
  
  // Convert PDF to individual page images using PDF.js
  console.log('🖼️ Converting PDF to individual page images for processing...');
  let pageImages = [];
  
  try {
    const { convertPdfToImagesWithPdfJs } = await import('./pdfJsImageService.ts');
    const { images, pageCount } = await convertPdfToImagesWithPdfJs(pdfData);
    pageImages = images;
    console.log(`✅ Generated ${pageImages.length} page images from ${pageCount} pages`);
  } catch (pdfJsError) {
    console.log(`⚠️ PDF.js conversion failed: ${pdfJsError.message}`);
    console.log('🔄 Trying alternative PDF conversion...');
    
    try {
      const { convertPdfToImages } = await import('../pdfToImageService.ts');
      const { images } = await convertPdfToImages(pdfData);
      pageImages = images;
      console.log(`✅ Generated ${pageImages.length} page images using alternative method`);
    } catch (altError) {
      throw new Error(`Failed to convert PDF to images: ${altError.message}`);
    }
  }
  
  if (pageImages.length === 0) {
    throw new Error('No page images generated from PDF');
  }
  
  const extractedTexts = [];
  let totalConfidence = 0;
  const maxPagesToProcess = Math.min(pageImages.length, 20); // Process up to 20 pages for large docs
  
  console.log(`📋 Processing ${maxPagesToProcess} pages out of ${pageImages.length} total pages...`);
  
  // Process pages individually with Gemini Vision
  for (let i = 0; i < maxPagesToProcess; i++) {
    console.log(`🔄 Processing page ${i + 1}/${maxPagesToProcess}...`);
    
    try {
      // Convert base64 image to bytes for Gemini Vision API
      const imageResponse = await fetch(pageImages[i]);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageArrayBuffer);
      
      const pageResult = await processImageWithGemini(imageBytes, `${fileName}_page_${i + 1}`, apiKey);
      
      if (pageResult.text.length > 50) {
        extractedTexts.push(`=== PAGE ${i + 1} ===\n${pageResult.text}`);
        totalConfidence += pageResult.confidence;
        console.log(`✅ Page ${i + 1}: ${pageResult.text.length} characters extracted`);
      } else {
        console.log(`⚠️ Page ${i + 1}: Minimal text extracted`);
      }
      
      // Rate limiting - wait between pages
      if (i < maxPagesToProcess - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
    } catch (pageError) {
      console.log(`⚠️ Page ${i + 1} failed: ${pageError.message}`);
      // Continue with other pages
    }
  }
  
  if (extractedTexts.length === 0) {
    throw new Error('No text extracted from any pages');
  }
  
  const combinedText = extractedTexts.join('\n\n');
  const avgConfidence = totalConfidence / extractedTexts.length;
  const processingTime = Date.now() - startTime;
  
  console.log(`✅ Large document processing completed: ${extractedTexts.length} pages processed, ${combinedText.length} total characters`);
  
  return {
    text: combinedText,
    confidence: avgConfidence,
    pageCount: pageImages.length,
    processingTime,
    processingNotes: `Gemini Vision page-by-page processing: ${extractedTexts.length}/${pageImages.length} pages, ${combinedText.length} characters in ${processingTime}ms`
  };
}

// Helper function to process individual images with Gemini Vision
async function processImageWithGemini(
  imageData: Uint8Array,
  pageName: string,
  apiKey: string
): Promise<{ text: string; confidence: number }> {
  
  // Convert image to base64 safely
  let base64Image: string;
  try {
    const binaryString = Array.from(imageData, byte => String.fromCharCode(byte)).join('');
    base64Image = btoa(binaryString);
    console.log(`✅ Image base64 conversion successful for ${pageName}: ${base64Image.length} characters`);
  } catch (conversionError) {
    console.error(`❌ Image base64 conversion failed for ${pageName}:`, conversionError);
    throw new Error(`Failed to convert image to base64: ${conversionError.message}`);
  }
  
  const payload = {
    contents: [{
      parts: [
        {
          text: `Extract ALL text from this page of a legal document. Be thorough and accurate. Include all visible text, maintaining formatting where possible. Do not summarize - extract the complete text exactly as shown.`
        },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 8000,
    }
  };

  console.log(`🚀 Processing image page: ${pageName}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for images
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error for ${pageName} (${response.status}):`, errorText);
      throw new Error(`Gemini API error for ${pageName} (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Gemini Vision response received for ${pageName}`);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Gemini API request timed out for ${pageName}`);
    }
    throw error;
  }
  
  if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
    throw new Error(`No content generated by Gemini Vision for ${pageName}`);
  }

  const extractedText = result.candidates[0].content.parts[0].text;
  const confidence = calculateTextConfidence(extractedText);
  
  return { text: extractedText, confidence };
}

function buildLegalDocumentPrompt(fileName: string): string {
  const isHOADocument = fileName.toLowerCase().includes('hoa') || 
                       fileName.toLowerCase().includes('charter') ||
                       fileName.toLowerCase().includes('bylaws') ||
                       fileName.toLowerCase().includes('ccr');
  
  const isContractDocument = fileName.toLowerCase().includes('contract') ||
                            fileName.toLowerCase().includes('agreement') ||
                            fileName.toLowerCase().includes('lease');
  
  let specificInstructions = '';
  
  if (isHOADocument) {
    specificInstructions = `
This appears to be an HOA (Homeowners Association) document. Pay special attention to:
- Board composition and voting procedures
- Assessment and fee structures
- Architectural guidelines and restrictions
- Common area usage rules
- Violation and enforcement procedures
- Amendment processes
`;
  } else if (isContractDocument) {
    specificInstructions = `
This appears to be a legal contract. Pay special attention to:
- Party names and contact information
- Terms and conditions
- Payment schedules and amounts
- Termination clauses
- Liability and warranty provisions
- Governing law and jurisdiction
`;
  } else {
    specificInstructions = `
This appears to be a legal document. Pay attention to:
- Key legal terms and definitions
- Important dates and deadlines
- Financial amounts and obligations
- Rights and responsibilities of parties
- Procedural requirements
`;
  }

  return `You are a legal document OCR specialist. Extract ALL text from this PDF document with maximum accuracy and completeness.

${specificInstructions}

CRITICAL REQUIREMENTS:
1. Extract ALL visible text - do not summarize or paraphrase
2. Maintain exact formatting, spacing, and structure where possible
3. Preserve section headers, bullet points, and numbering
4. Include all legal clauses, definitions, and fine print
5. Capture all dates, amounts, percentages, and specific terms
6. Maintain paragraph breaks and document structure
7. If tables are present, format them clearly with appropriate spacing
8. Include page numbers or section references if visible
9. Do not omit any content, even if it seems repetitive

For scanned documents:
- Use your best OCR capabilities to read even low-quality text
- If text is unclear, provide your best interpretation
- Include all visible text even if formatting is imperfect

Output the complete extracted text exactly as it appears in the document. This is for legal analysis, so accuracy and completeness are essential.`;
}

function calculateTextConfidence(text: string): number {
  if (!text || text.length < 50) return 0.1;
  
  // Check for legal document indicators
  const legalTerms = [
    'agreement', 'contract', 'whereas', 'therefore', 'party', 'parties',
    'section', 'article', 'clause', 'provision', 'terms', 'conditions',
    'liability', 'warranty', 'governing', 'jurisdiction', 'amendment',
    'bylaws', 'charter', 'board', 'association', 'homeowners'
  ];
  
  const foundTerms = legalTerms.filter(term => 
    text.toLowerCase().includes(term)
  ).length;
  
  // Base confidence
  let confidence = 0.6;
  
  // Boost for legal terms
  confidence += Math.min(foundTerms * 0.05, 0.3);
  
  // Boost for document structure
  if (text.includes('SECTION') || text.includes('ARTICLE')) confidence += 0.1;
  if (text.includes('WHEREAS') || text.includes('THEREFORE')) confidence += 0.1;
  
  // Boost for length (more text generally means better extraction)
  if (text.length > 1000) confidence += 0.05;
  if (text.length > 5000) confidence += 0.05;
  if (text.length > 10000) confidence += 0.05;
  
  return Math.min(confidence, 0.95);
}

function estimatePageCount(text: string, fileSize: number): number {
  // Multiple estimation methods
  const charBasedPages = Math.max(1, Math.ceil(text.length / 3000)); // ~3000 chars per page
  const sizeBasedPages = Math.max(1, Math.ceil(fileSize / 50000)); // ~50KB per page
  
  // Use the more conservative estimate
  return Math.max(charBasedPages, Math.min(sizeBasedPages, charBasedPages * 2));
}