
// Fixed OpenAI Vision Service with comprehensive debugging and error handling

export async function extractTextWithOpenAIVision(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
}> {
  console.log('🔍 Starting FIXED OpenAI Vision OCR extraction...');
  
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    console.log('✅ OpenAI API key found, proceeding with Vision API call...');
    
    // Convert PDF to base64 for OpenAI Vision
    console.log('📄 Converting PDF to base64...');
    const base64Pdf = btoa(String.fromCharCode(...pdfData));
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
    
    console.log(`✅ PDF converted to base64 (${base64Pdf.length} characters)`);
    console.log('🚀 Making OpenAI Vision API call...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert OCR system specialized in legal documents. Extract ALL text from this document with perfect accuracy.

CRITICAL INSTRUCTIONS:
- Extract EVERY word exactly as written
- Preserve all formatting, line breaks, and structure  
- Include headers, body text, signatures, and contact information
- Pay special attention to legal terminology and case details
- For demand letters: extract sender info, recipient info, legal claims, damages, and all body content

Return ONLY the extracted text exactly as it appears in the document.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this legal document with complete accuracy. Preserve formatting and include all content:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.0
      }),
    });

    console.log(`📡 OpenAI API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API response received successfully');
    
    if (!data.choices || data.choices.length === 0) {
      console.error('❌ No choices in OpenAI API response');
      throw new Error('No choices in OpenAI API response');
    }
    
    const extractedText = data.choices[0]?.message?.content || '';
    console.log(`📝 Extracted text length: ${extractedText.length} characters`);
    
    if (extractedText.length > 0) {
      console.log(`📖 Text preview: "${extractedText.substring(0, 300)}..."`);
    } else {
      console.warn('⚠️ No text content extracted from document');
    }
    
    const confidence = calculateConfidence(extractedText);
    const pageCount = estimatePageCount(extractedText);
    
    console.log(`✅ Vision extraction complete: ${extractedText.length} chars, confidence: ${confidence}, pages: ${pageCount}`);
    
    return {
      text: extractedText.trim(),
      confidence: confidence,
      pageCount: pageCount
    };

  } catch (error) {
    console.error('❌ OpenAI Vision OCR failed with error:', error);
    console.error('Error details:', error.message);
    
    // Return empty result instead of throwing
    return {
      text: '',
      confidence: 0,
      pageCount: 1
    };
  }
}

// Calculate confidence based on text quality
function calculateConfidence(text: string): number {
  if (!text || text.length < 20) return 0.1;
  
  let confidence = 0.7; // Base confidence for gpt-4o
  
  // Check for legal document indicators
  const legalTerms = [
    'DTPA', 'DEMAND LETTER', 'ATTORNEY', 'LAW FIRM', 'PLAINTIFF', 'DEFENDANT',
    'COURT', 'CASE', 'PURSUANT TO', 'VIOLATION', 'DAMAGES', 'SETTLEMENT',
    'TEXAS DECEPTIVE TRADE PRACTICES', 'REQUEST FOR PRODUCTION', 'DISCOVERY'
  ];
  
  const upperText = text.toUpperCase();
  const foundLegalTerms = legalTerms.filter(term => upperText.includes(term));
  
  if (foundLegalTerms.length > 0) {
    confidence += 0.2;
    console.log(`✅ Legal content boost: found ${foundLegalTerms.length} legal terms`);
  }
  
  // Check for proper document structure
  const hasProperStructure = (
    text.includes('\n') && 
    text.length > 200 &&
    text.match(/[.!?]/g)?.length > 3
  );
  
  if (hasProperStructure) {
    confidence += 0.1;
  }
  
  // Check for email addresses (contact info)
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    confidence += 0.05;
  }
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

// Estimate page count from content
function estimatePageCount(text: string): number {
  if (!text) return 1;
  
  // Look for page indicators first
  const pageBreaks = text.match(/page\s+\d+/gi) || [];
  if (pageBreaks.length > 0) {
    return Math.max(1, pageBreaks.length);
  }
  
  // Estimate based on content length (legal documents ~400-600 chars per page)
  const estimatedPages = Math.max(1, Math.ceil(text.length / 500));
  return Math.min(estimatedPages, 10); // Cap at 10 pages for safety
}
