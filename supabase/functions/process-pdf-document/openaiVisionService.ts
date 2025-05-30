
// Enhanced OpenAI Vision Service for PDF OCR with better prompting

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
    
    console.log('📄 Processing PDF with enhanced OpenAI Vision prompts...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert legal document OCR system. Your task is to extract ALL text from this legal document with perfect accuracy and formatting.

CRITICAL INSTRUCTIONS:
- Extract EVERY word, sentence, and paragraph exactly as written
- Maintain original formatting, line breaks, and structure
- Include ALL headers, footers, signatures, and metadata
- Pay special attention to legal terminology, case numbers, dates, and names
- For legal documents like DTPA demand letters, extract all content including:
  * Attorney/law firm information
  * Client and opposing party details
  * Legal claims and demands
  * Statutory references
  * Damage amounts and calculations
  * All body paragraphs and legal arguments

DO NOT:
- Summarize or paraphrase any content
- Skip any text, even if it seems repetitive
- Add your own interpretations or comments
- Omit headers, footers, or metadata

RETURN ONLY the extracted text exactly as it appears in the document.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text from this legal document with complete accuracy:'
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
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';
    
    // Enhanced confidence calculation
    let confidence = calculateEnhancedConfidence(extractedText);
    
    console.log(`✅ Enhanced OpenAI Vision extraction completed: ${extractedText.length} chars (confidence: ${confidence})`);
    console.log(`📄 Text preview: "${extractedText.substring(0, 300)}..."`);

    return {
      text: extractedText.trim(),
      confidence: confidence,
      pageCount: estimatePageCount(extractedText)
    };

  } catch (error) {
    console.error('❌ Enhanced OpenAI Vision OCR failed:', error);
    return {
      text: '',
      confidence: 0,
      pageCount: 1
    };
  }
}

// Enhanced confidence calculation based on content quality
function calculateEnhancedConfidence(text: string): number {
  if (!text || text.length < 50) return 0.1;
  
  let confidence = 0.6; // Base confidence for OpenAI Vision
  
  // Check for legal document indicators (high confidence boost)
  const legalTerms = [
    'DTPA', 'DEMAND LETTER', 'ATTORNEY', 'LAW FIRM', 'PLAINTIFF', 'DEFENDANT',
    'COURT', 'CASE', 'PURSUANT TO', 'VIOLATION', 'DAMAGES', 'SETTLEMENT',
    'TEXAS DECEPTIVE TRADE PRACTICES', 'REQUEST FOR PRODUCTION', 'DISCOVERY'
  ];
  
  const upperText = text.toUpperCase();
  const foundLegalTerms = legalTerms.filter(term => upperText.includes(term));
  
  if (foundLegalTerms.length > 0) {
    confidence += 0.2; // Boost for legal content
    console.log(`✅ Legal document detected with terms: ${foundLegalTerms.join(', ')}`);
  }
  
  // Check for structured content
  if (text.includes('\n') && text.length > 200) {
    confidence += 0.1; // Boost for structured text
  }
  
  // Check for proper sentences
  const sentences = text.match(/[.!?]+/g) || [];
  if (sentences.length > 3) {
    confidence += 0.1; // Boost for complete sentences
  }
  
  // Penalize if text seems truncated or incomplete
  if (text.length < 100) {
    confidence -= 0.3;
  } else if (text.includes('[unclear]') || text.includes('...')) {
    confidence -= 0.1;
  }
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

// Estimate page count from content length and structure
function estimatePageCount(text: string): number {
  if (!text) return 1;
  
  // Rough estimation: 500-800 characters per page for legal documents
  const estimatedPages = Math.max(1, Math.ceil(text.length / 600));
  
  // Look for page indicators
  const pageBreaks = text.match(/page\s+\d+/gi) || [];
  if (pageBreaks.length > 0) {
    return Math.max(estimatedPages, pageBreaks.length);
  }
  
  return estimatedPages;
}
