// Google Cloud Document AI service for superior OCR on scanned documents

export async function extractTextWithGoogleDocumentAI(pdfData: Uint8Array): Promise<{
  text: string;
  confidence: number;
  pageCount?: number;
}> {
  console.log('🔍 Starting Google Cloud Document AI OCR extraction...');
  console.log(`📊 PDF data size: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);
  
  try {
    const googleCloudApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    const googleCloudProjectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
    
    if (!googleCloudApiKey || !googleCloudProjectId) {
      console.log('⚠️ Google Cloud credentials not found, skipping Google Cloud Document AI');
      throw new Error('Google Cloud credentials not available');
    }
    
    console.log('✅ Google Cloud credentials found, proceeding with Document AI...');
    
    // Convert PDF to base64
    const base64Pdf = btoa(String.fromCharCode(...pdfData));
    
    // Google Cloud Document AI API call
    const response = await fetch(
      `https://documentai.googleapis.com/v1/projects/${googleCloudProjectId}/locations/us/processors/ocr/batchProcess`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleCloudApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            inputDocuments: {
              gcsDocuments: {
                documents: [{
                  gcsUri: `data:application/pdf;base64,${base64Pdf}`,
                  mimeType: 'application/pdf'
                }]
              }
            },
            documentOutputConfig: {
              gcsOutputConfig: {
                gcsUri: 'gs://temp-bucket/output'
              }
            }
          }]
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Cloud Document AI error:', errorText);
      throw new Error(`Google Cloud Document AI failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.document || !result.document.text) {
      throw new Error('No text extracted from Google Cloud Document AI');
    }
    
    const extractedText = result.document.text;
    const pageCount = result.document.pages?.length || 1;
    
    console.log(`✅ Google Cloud Document AI extraction successful: ${extractedText.length} characters from ${pageCount} pages`);
    
    // Calculate confidence based on text quality
    const confidence = calculateDocumentAiConfidence(extractedText);
    
    return {
      text: extractedText,
      confidence: confidence,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('❌ Google Cloud Document AI failed:', error);
    throw new Error(`Google Cloud Document AI extraction failed: ${error.message}`);
  }
}

// Calculate confidence for Google Cloud Document AI results
function calculateDocumentAiConfidence(text: string): number {
  if (!text || text.length < 20) return 0.1;
  
  let confidence = 0.9; // High base confidence for Google Cloud Document AI
  
  // Check for proper document structure
  const hasProperStructure = (
    text.includes('\n') && 
    text.length > 200 &&
    text.match(/[.!?]/g)?.length > 5
  );
  
  if (hasProperStructure) {
    confidence += 0.05;
  }
  
  // Check for legal document indicators
  const legalTerms = [
    'DEMAND LETTER', 'DTPA', 'DECEPTIVE TRADE PRACTICES', 
    'ATTORNEY', 'LAW FIRM', 'LEGAL', 'COURT', 'CASE',
    'PLAINTIFF', 'DEFENDANT', 'PURSUANT TO', 'VIOLATION',
    'DAMAGES', 'SETTLEMENT', 'DEMAND', 'LETTER'
  ];
  
  const hasLegalContent = legalTerms.some(term => 
    text.toUpperCase().includes(term)
  );
  
  if (hasLegalContent) {
    confidence += 0.05;
  }
  
  return Math.max(0.1, Math.min(0.98, confidence));
}