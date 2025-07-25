// Mistral OCR Service - Direct PDF processing

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

export interface MistralOcrResult {
  text: string;
  confidence: number;
  pageCount?: number;
}

export async function extractTextWithMistralOcr(pdfData: Uint8Array): Promise<MistralOcrResult> {
  console.log('🔍 Starting Mistral OCR extraction...');
  
  const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!mistralApiKey) {
    throw new Error('Mistral API key not available');
  }

  try {
    // Convert PDF to base64 using chunked approach to avoid stack overflow
    const base64Pdf = uint8ArrayToBase64(pdfData);
    
    console.log(`📊 PDF data size: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all the text from this PDF document. Return only the extracted text content without any additional formatting or commentary.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || '';

    if (!extractedText || extractedText.length < 10) {
      throw new Error('Mistral OCR returned insufficient text content');
    }

    // Calculate confidence based on text quality
    const confidence = calculateOcrConfidence(extractedText);
    
    console.log(`✅ Mistral OCR completed: ${extractedText.length} characters extracted`);

    return {
      text: extractedText,
      confidence: confidence,
      pageCount: Math.max(1, Math.ceil(pdfData.length / 50000)) // Estimate pages
    };

  } catch (error) {
    console.error('❌ Mistral OCR extraction failed:', error);
    throw new Error(`Mistral OCR extraction failed: ${error.message}`);
  }
}

function calculateOcrConfidence(text: string): number {
  if (!text || text.length < 10) return 0.1;
  
  // Calculate confidence based on text characteristics
  const alphanumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const avgWordLength = text.replace(/\s+/g, '').length / Math.max(wordCount, 1);
  
  // Higher confidence for more readable text
  let confidence = 0.5; // Base confidence
  
  if (alphanumericRatio > 0.7) confidence += 0.2;
  if (wordCount > 50) confidence += 0.1;
  if (avgWordLength >= 3 && avgWordLength <= 8) confidence += 0.1;
  if (text.length > 100) confidence += 0.1;
  
  return Math.min(0.95, Math.max(0.1, confidence));
}