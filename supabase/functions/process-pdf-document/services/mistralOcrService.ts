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

async function uploadFileToMistral(pdfData: Uint8Array, mistralApiKey: string): Promise<string> {
  console.log('📤 Uploading PDF to Mistral file storage...');
  
  // Create form data for file upload
  const formData = new FormData();
  const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'document.pdf');
  formData.append('purpose', 'ocr');

  const uploadResponse = await fetch('https://api.mistral.ai/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${mistralApiKey}`,
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Mistral file upload error: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  const fileId = uploadResult.id;
  
  if (!fileId) {
    throw new Error('Mistral file upload did not return a file ID');
  }

  console.log(`✅ File uploaded to Mistral with ID: ${fileId}`);
  return fileId;
}

export async function extractTextWithMistralOcr(pdfData: Uint8Array): Promise<MistralOcrResult> {
  console.log('🔍 Starting Mistral OCR extraction...');
  
  const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!mistralApiKey) {
    throw new Error('Mistral API key not available');
  }

  let fileId: string | null = null;

  try {
    console.log(`📊 PDF data size: ${pdfData.length} bytes (${Math.round(pdfData.length / 1024)}KB)`);

    // Step 1: Upload the PDF file to Mistral storage
    fileId = await uploadFileToMistral(pdfData, mistralApiKey);

    // Step 2: Process with OCR using the file ID
    console.log('🔍 Processing PDF with Mistral OCR...');
    const response = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        id: `ocr-${Date.now()}`,
        document: {
          type: 'file',
          file_id: fileId
        },
        pages: null, // Process all pages
        include_image_base64: false,
        image_limit: 0,
        image_min_size: 0,
        bbox_annotation_format: {
          type: 'text'
        },
        document_annotation_format: {
          type: 'text'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral OCR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Extract text from OCR API response
    let extractedText = '';
    if (result.pages && Array.isArray(result.pages)) {
      extractedText = result.pages
        .map((page: any) => page.text || page.markdown || '')
        .filter((text: string) => text.trim().length > 0)
        .join('\n\n');
    } else if (result.text) {
      extractedText = result.text;
    } else if (result.content) {
      extractedText = result.content;
    }

    if (!extractedText || extractedText.length < 10) {
      throw new Error('Mistral OCR returned insufficient text content');
    }

    // Calculate confidence based on text quality
    const confidence = calculateOcrConfidence(extractedText);
    
    console.log(`✅ Mistral OCR completed: ${extractedText.length} characters extracted`);

    return {
      text: extractedText,
      confidence: confidence,
      pageCount: result.pages ? result.pages.length : Math.max(1, Math.ceil(pdfData.length / 50000))
    };

  } catch (error) {
    console.error('❌ Mistral OCR extraction failed:', error);
    throw new Error(`Mistral OCR extraction failed: ${error.message}`);
  } finally {
    // Optional: Clean up uploaded file
    if (fileId) {
      try {
        console.log(`🧹 Cleaning up uploaded file: ${fileId}`);
        await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mistralApiKey}`,
          },
        });
        console.log(`✅ File ${fileId} deleted from Mistral storage`);
      } catch (cleanupError) {
        console.warn(`⚠️ Failed to delete file ${fileId}:`, cleanupError);
        // Don't throw on cleanup failure
      }
    }
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