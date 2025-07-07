
// Real PDF to Image conversion service using PDFShift API
// This converts PDF pages to images that can be processed by OpenAI Vision

export async function convertPdfToImages(pdfData: Uint8Array): Promise<{
  images: string[]; // Array of base64 image data URLs
  pageCount: number;
}> {
  console.log('🖼️ Starting real PDF to image conversion using PDFShift API...');
  console.log(`📊 PDF data size: ${pdfData.length} bytes`);
  
  const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
  
  if (!pdfShiftApiKey) {
    console.error('❌ PDFShift API key not found');
    throw new Error('PDFShift API key is required for PDF to image conversion');
  }
  
  try {
    // Convert PDF to images using PDFShift API
    const images = await convertPdfWithPdfShift(pdfData, pdfShiftApiKey);
    
    console.log(`✅ Successfully converted PDF to ${images.length} images using PDFShift`);
    return {
      images,
      pageCount: images.length
    };
    
  } catch (error) {
    console.error('❌ PDF to image conversion failed:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

// Real PDF conversion using PDFShift API
async function convertPdfWithPdfShift(pdfData: Uint8Array, apiKey: string): Promise<string[]> {
  console.log('📄 Converting PDF pages to images using PDFShift API...');
  
  try {
    // Convert PDF data to base64 for API
    const base64Pdf = btoa(String.fromCharCode(...pdfData));
    
    // PDFShift API call to convert PDF to images
    console.log('🚀 Making PDFShift API call...');
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: `data:application/pdf;base64,${base64Pdf}`,
        format: 'png',
        quality: 100,
        resolution: 300, // Higher DPI for better OCR quality
        output: 'images'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDFShift API error:', errorText);
      throw new Error(`PDFShift API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ PDFShift conversion successful, got ${result.images?.length || 0} images`);
    
    // Return the base64 image data URLs
    return result.images || [];
    
  } catch (error) {
    console.error('❌ Failed to convert PDF with PDFShift:', error);
    throw error;
  }
}

// Alternative: Use Canvas API to render text as image (for testing)
export function createTextImage(text: string): string {
  // This would create an image with the extracted text
  // For now, return placeholder
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${base64Png}`;
}
