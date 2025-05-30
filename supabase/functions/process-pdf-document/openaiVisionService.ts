
// OpenAI Vision Service for PDF OCR

export async function extractTextWithOpenAIVision(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
}> {
  console.log('🔍 Starting OpenAI Vision OCR extraction...');
  
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    // Convert PDF to images (first few pages for processing)
    const images = await convertPdfToImages(pdfData);
    console.log(`Converted PDF to ${images.length} images for OCR processing`);
    
    if (images.length === 0) {
      throw new Error('Could not convert PDF to images for OCR');
    }
    
    const extractedTexts: string[] = [];
    let totalConfidence = 0;
    
    // Process up to first 3 pages to avoid token limits
    const pagesToProcess = Math.min(images.length, 3);
    
    for (let i = 0; i < pagesToProcess; i++) {
      console.log(`Processing page ${i + 1}/${pagesToProcess} with OpenAI Vision...`);
      
      const pageResult = await extractTextFromImageWithOpenAI(images[i], openaiApiKey);
      if (pageResult.text && pageResult.text.length > 20) {
        extractedTexts.push(pageResult.text);
        totalConfidence += pageResult.confidence;
        console.log(`Page ${i + 1} extracted: ${pageResult.text.length} chars (confidence: ${pageResult.confidence})`);
      }
    }
    
    if (extractedTexts.length === 0) {
      throw new Error('No text could be extracted from any pages');
    }
    
    const combinedText = extractedTexts.join('\n\n');
    const averageConfidence = totalConfidence / extractedTexts.length;
    
    console.log(`✅ OpenAI Vision OCR completed: ${combinedText.length} chars from ${extractedTexts.length} pages`);
    
    return {
      text: combinedText,
      confidence: averageConfidence,
      pageCount: images.length
    };
    
  } catch (error) {
    console.error('❌ OpenAI Vision OCR failed:', error);
    return {
      text: '',
      confidence: 0,
      pageCount: 1
    };
  }
}

// Convert PDF to base64 images for OpenAI Vision
async function convertPdfToImages(pdfData: Uint8Array): Promise<string[]> {
  try {
    // For now, we'll create a single image from the PDF data
    // In a full implementation, you'd use a PDF-to-image library
    // But for MVP, we'll try to extract using the PDF as a base64 image
    
    const base64Pdf = btoa(String.fromCharCode(...pdfData));
    
    // Return the PDF as base64 - OpenAI can sometimes process PDFs directly
    return [`data:application/pdf;base64,${base64Pdf}`];
    
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    return [];
  }
}

// Extract text from image using OpenAI Vision
async function extractTextFromImageWithOpenAI(imageData: string, apiKey: string): Promise<{
  text: string;
  confidence: number;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert OCR system. Extract ALL text from this legal document image with perfect accuracy. 

IMPORTANT INSTRUCTIONS:
- Extract every word, number, and piece of text visible in the document
- Maintain the original formatting and structure as much as possible
- Include headers, footers, page numbers, and any metadata
- For legal documents, pay special attention to case numbers, dates, names, and legal terminology
- If you see handwritten text, include it as well
- Do not summarize or paraphrase - extract the exact text as written
- If any text is unclear, make your best guess but indicate uncertainty with [unclear]

Return ONLY the extracted text, no explanations or commentary.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text from this legal document:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Calculate confidence based on response quality
    let confidence = 0.8; // Base confidence for OpenAI Vision
    
    if (extractedText.length < 50) {
      confidence = 0.3;
    } else if (extractedText.length < 200) {
      confidence = 0.5;
    } else if (extractedText.includes('[unclear]')) {
      confidence = 0.6;
    }
    
    // Boost confidence for legal document indicators
    const legalTerms = ['COURT', 'CASE', 'PLAINTIFF', 'DEFENDANT', 'DISCOVERY', 'REQUEST'];
    const hasLegalTerms = legalTerms.some(term => extractedText.toUpperCase().includes(term));
    if (hasLegalTerms) {
      confidence = Math.min(0.9, confidence + 0.1);
    }

    return {
      text: extractedText.trim(),
      confidence: confidence
    };

  } catch (error) {
    console.error('Error extracting text with OpenAI Vision:', error);
    return {
      text: '',
      confidence: 0
    };
  }
}
