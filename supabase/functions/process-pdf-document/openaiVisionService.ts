
// Enhanced OpenAI Vision Service with multiple attempts and better prompting

export async function extractTextWithOpenAIVision(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
}> {
  console.log('🔍 Starting enhanced OpenAI Vision OCR extraction...');
  
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    // Convert PDF to base64 for OpenAI Vision
    const base64Pdf = btoa(String.fromCharCode(...pdfData));
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
    
    console.log('📄 Processing PDF with enhanced OpenAI Vision (multiple attempts)...');
    
    // Try multiple prompting strategies for better results
    const strategies = [
      {
        name: 'Legal Document Specialist',
        systemPrompt: `You are an expert legal document OCR system. Extract ALL text from this document with perfect accuracy.

CRITICAL INSTRUCTIONS:
- Extract EVERY word exactly as written
- Preserve all formatting, line breaks, and structure  
- Include headers, body text, signatures, and contact information
- Pay special attention to legal terminology and case details
- For demand letters: extract sender info, recipient info, legal claims, damages, and all body content

Return ONLY the extracted text exactly as it appears.`,
        userPrompt: 'Extract all text from this legal document with complete accuracy. Preserve formatting and include all content:'
      },
      {
        name: 'OCR Specialist',
        systemPrompt: `You are a professional OCR system. Your only job is to extract text from images/documents.

RULES:
- Extract EVERY character, word, and line exactly as shown
- Do not summarize, interpret, or skip any content
- Maintain original spacing and line breaks
- Include all text including headers, footers, addresses, and signatures

Output only the raw extracted text.`,
        userPrompt: 'Perform OCR on this document and extract all visible text:'
      }
    ];

    // Try each strategy
    for (const strategy of strategies) {
      try {
        console.log(`Trying strategy: ${strategy.name}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o', // Use more powerful model for better OCR
            messages: [
              {
                role: 'system',
                content: strategy.systemPrompt
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: strategy.userPrompt
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
            temperature: 0.0 // Deterministic for OCR
          }),
        });

        if (!response.ok) {
          console.warn(`Strategy ${strategy.name} failed: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const extractedText = data.choices[0]?.message?.content || '';
        
        if (extractedText.length > 100) {
          console.log(`✅ Strategy ${strategy.name} successful: ${extractedText.length} chars`);
          
          const confidence = calculateEnhancedConfidence(extractedText);
          return {
            text: extractedText.trim(),
            confidence: confidence,
            pageCount: estimatePageCount(extractedText)
          };
        }
        
        console.warn(`Strategy ${strategy.name} returned insufficient text: ${extractedText.length} chars`);
        
      } catch (strategyError) {
        console.warn(`Strategy ${strategy.name} error:`, strategyError);
        continue;
      }
    }
    
    // If all strategies fail, return empty with low confidence
    console.error('❌ All OpenAI Vision strategies failed');
    return {
      text: '',
      confidence: 0,
      pageCount: 1
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

// Enhanced confidence calculation
function calculateEnhancedConfidence(text: string): number {
  if (!text || text.length < 20) return 0.1;
  
  let confidence = 0.7; // Higher base for gpt-4o
  
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
  
  // Penalize if text seems corrupted
  const corruptionIndicators = [
    /[^\x20-\x7E\s\n\r\t]/g, // Non-printable characters
    /\s{10,}/g, // Excessive whitespace
    /[A-Za-z]{50,}/g // Overly long words
  ];
  
  for (const indicator of corruptionIndicators) {
    const matches = text.match(indicator);
    if (matches && matches.length > 3) {
      confidence -= 0.1;
    }
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
