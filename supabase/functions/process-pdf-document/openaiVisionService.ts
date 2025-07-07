// Complete OpenAI Vision Service with PDF-to-Image conversion and native fallback

import { convertPdfToImages } from './pdfToImageService.ts';
import { extractTextWithLibrary } from './pdfLibraryService.ts';

export async function extractTextWithOpenAIVision(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
}> {
  console.log('🔍 Starting OpenAI Vision OCR extraction with PDF-to-Image conversion...');
  console.log(`📊 PDF data size: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not found - Vision extraction cannot proceed');
    }
    
    console.log('✅ OpenAI API key found, proceeding with Vision API call...');
    
    // Validate PDF data
    if (pdfData.length === 0) {
      console.error('❌ PDF data is empty');
      throw new Error('PDF data is empty');
    }
    
    if (pdfData.length > 20 * 1024 * 1024) { // 20MB limit for Vision API
      console.error(`❌ PDF too large for Vision API: ${Math.round(pdfData.length / 1024 / 1024)}MB`);
      throw new Error(`PDF too large for Vision API: ${Math.round(pdfData.length / 1024 / 1024)}MB (max 20MB)`);
    }
    
    try {
      // STEP 1: Convert PDF to images
      console.log('🖼️ Converting PDF pages to images for Vision API...');
      const { images, pageCount } = await convertPdfToImages(pdfData);
      
      if (images.length === 0) {
        throw new Error('No images generated from PDF');
      }
      
      console.log(`✅ PDF converted to ${images.length} images`);
      
      // STEP 2: Process each image with Vision API
      const extractedTexts: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        console.log(`📄 Processing page ${i + 1}/${images.length} with Vision API...`);
        
        const pageText = await extractTextFromImage(images[i], openaiApiKey);
        if (pageText && pageText.trim().length > 0) {
          extractedTexts.push(pageText.trim());
          console.log(`✅ Page ${i + 1} extracted: ${pageText.length} characters`);
          console.log(`Page ${i + 1} sample: "${pageText.substring(0, 100)}..."`);
        } else {
          console.log(`⚠️ Page ${i + 1} extracted no readable text`);
        }
      }
      
      // STEP 3: Combine all extracted text
      const combinedText = extractedTexts.join('\n\n').trim();
      
      if (combinedText.length > 0) {
        console.log(`✅ Vision extraction successful: ${combinedText.length} total characters`);
        
        const confidence = calculateEnhancedConfidence(combinedText, true);
        
        return {
          text: combinedText,
          confidence: confidence,
          pageCount: pageCount
        };
      } else {
        throw new Error('Vision API extracted no readable text from images');
      }
      
    } catch (visionError) {
      console.error('❌ Vision processing failed, trying native PDF parsing fallback:', visionError);
      
      // FALLBACK: Use native PDF text extraction
      console.log('🔄 Falling back to native PDF text extraction...');
      
      try {
        const nativeResult = await extractTextWithLibrary(pdfData);
        
        if (nativeResult.text && nativeResult.text.length > 50) {
          console.log(`✅ Native extraction successful: ${nativeResult.text.length} characters`);
          
          return {
            text: nativeResult.text,
            confidence: 0.7, // Lower confidence for native extraction
            pageCount: nativeResult.pageCount
          };
        } else {
          throw new Error('Native extraction also failed to extract meaningful text');
        }
        
      } catch (nativeError) {
        console.error('❌ Native extraction also failed:', nativeError);
        throw new Error(`Both Vision and native extraction failed: ${visionError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ OpenAI Vision OCR failed with error:', error);
    console.error('Error stack trace:', error.stack);
    
    // Re-throw the error to let the calling function handle it
    throw new Error(`Vision extraction failed: ${error.message}`);
  }
}

// Extract text from a single image using OpenAI Vision
async function extractTextFromImage(imageDataUrl: string, openaiApiKey: string): Promise<string> {
  // Enhanced prompt for legal document extraction
  const systemPrompt = `You are an expert OCR system specialized in extracting text from legal documents, particularly demand letters and DTPA (Texas Deceptive Trade Practices Act) documents.

CRITICAL EXTRACTION REQUIREMENTS:
- Extract EVERY word of text exactly as written in the document
- Preserve all formatting, line breaks, and paragraph structure
- Pay special attention to legal terminology, case references, and statutory citations
- Include ALL content: headers, body text, sender/recipient information, signatures, contact details
- For demand letters: extract sender info, recipient info, legal claims, damages amounts, and all body content
- Maintain the original document structure and flow

QUALITY STANDARDS:
- Extract text with 100% accuracy
- Do not summarize or paraphrase - extract the exact text
- Include legal case citations, statute references, and technical terms precisely
- Preserve dates, amounts, and proper names exactly as written

Return ONLY the extracted text exactly as it appears in the document. Do not add commentary or explanations.`;

  const requestPayload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this legal document with complete accuracy. This is a legal document that requires precise text extraction:'
          },
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 4000,
    temperature: 0.0
  };
  
  console.log('🚀 Making OpenAI Vision API call for image...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  console.log(`📡 OpenAI API response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ OpenAI API error details: ${errorText}`);
    throw new Error(`OpenAI Vision API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    console.error('❌ No choices in OpenAI API response:', JSON.stringify(data));
    throw new Error('No choices in OpenAI API response - extraction failed');
  }
  
  const extractedText = data.choices[0]?.message?.content || '';
  console.log(`📝 Extracted text length: ${extractedText.length} characters`);
  
  return extractedText;
}

// Validate if extracted text appears to be from a legal document
function validateLegalDocumentExtraction(text: string): boolean {
  if (!text || text.length < 50) return false;
  
  const upperText = text.toUpperCase();
  
  // Check for legal document indicators
  const legalIndicators = [
    'DEMAND LETTER', 'DTPA', 'DECEPTIVE TRADE PRACTICES', 
    'ATTORNEY', 'LAW FIRM', 'LEGAL', 'COURT', 'CASE',
    'PLAINTIFF', 'DEFENDANT', 'PURSUANT TO', 'VIOLATION',
    'DAMAGES', 'SETTLEMENT', 'TEXAS', 'DEMAND', 'LETTER',
    'REQUEST FOR PRODUCTION', 'DISCOVERY', 'MOTION'
  ];
  
  const foundIndicators = legalIndicators.filter(indicator => 
    upperText.includes(indicator)
  );
  
  console.log(`🔍 Legal indicators found: ${foundIndicators.join(', ')}`);
  
  return foundIndicators.length > 0;
}

// Enhanced confidence calculation
function calculateEnhancedConfidence(text: string, isLegalDocument: boolean): number {
  if (!text || text.length < 20) return 0.1;
  
  let confidence = 0.8; // High base confidence for gpt-4o Vision
  
  // Boost for legal document
  if (isLegalDocument) {
    confidence += 0.1;
    console.log('✅ Legal document boost applied');
  }
  
  // Check for proper document structure
  const hasProperStructure = (
    text.includes('\n') && 
    text.length > 200 &&
    text.match(/[.!?]/g)?.length > 5
  );
  
  if (hasProperStructure) {
    confidence += 0.05;
  }
  
  // Check for contact information
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    confidence += 0.05;
  }
  
  // Check for dates and amounts (common in legal docs)
  if (/\$[\d,]+/.test(text) || /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text)) {
    confidence += 0.05;
  }
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

// Estimate page count from content
function estimatePageCount(text: string): number {
  if (!text) return 1;
  
  // Look for explicit page indicators
  const pageMatches = text.match(/page\s+\d+/gi);
  if (pageMatches && pageMatches.length > 0) {
    return Math.max(1, pageMatches.length);
  }
  
  // Estimate based on content length (legal documents ~500-700 chars per page)
  const estimatedPages = Math.max(1, Math.ceil(text.length / 600));
  return Math.min(estimatedPages, 15); // Cap at 15 pages
}
