// PDF to Image conversion service using PDF.js for Deno
// Converts PDF pages to base64 encoded PNG images for OCR processing

export async function renderPdfToImages(pdfData: Uint8Array): Promise<string[]> {
  console.log('🖼️ Starting PDF to image conversion...');
  
  try {
    // Import PDF.js for Deno
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs');
    
    // Create Canvas API polyfill for Deno
    const { createCanvas } = await import('https://deno.land/x/canvas@v1.4.1/mod.ts');
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
    
    // Load the PDF document
    console.log(`📄 Loading PDF document (${pdfData.length} bytes)...`);
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0
    });
    
    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded successfully: ${pdf.numPages} pages`);
    
    const images: string[] = [];
    const maxPages = Math.min(pdf.numPages, 5); // Limit to first 5 pages for performance
    
    console.log(`🖼️ Converting ${maxPages} pages to images...`);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`📄 Processing page ${pageNum}...`);
        
        // Get the page
        const page = await pdf.getPage(pageNum);
        
        // Set scale for good resolution (2.0 = 200% scale)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        console.log(`✅ Page ${pageNum} rendered to canvas (${viewport.width}x${viewport.height})`);
        
        // Convert canvas to base64 PNG
        const imageDataUrl = canvas.toDataURL('image/png');
        
        // Extract base64 data (remove data:image/png;base64, prefix)
        const base64Data = imageDataUrl.split(',')[1];
        
        if (base64Data && base64Data.length > 100) {
          images.push(base64Data);
          console.log(`✅ Page ${pageNum} converted to base64 image (${base64Data.length} chars)`);
        } else {
          console.warn(`⚠️ Page ${pageNum} conversion resulted in empty or small image`);
        }
        
        // Clean up page
        page.cleanup();
        
      } catch (pageError) {
        console.error(`❌ Failed to process page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (images.length === 0) {
      throw new Error('No pages could be converted to images');
    }
    
    console.log(`✅ PDF to image conversion completed: ${images.length} images created`);
    return images;
    
  } catch (error) {
    console.error('❌ PDF to image conversion failed:', error);
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
}

// Alternative simple conversion for fallback
export async function convertPdfPageToImage(pdfData: Uint8Array, pageNumber: number = 1): Promise<string> {
  console.log(`🖼️ Converting PDF page ${pageNumber} to image...`);
  
  try {
    const images = await renderPdfToImages(pdfData);
    
    if (images.length >= pageNumber) {
      return images[pageNumber - 1];
    } else {
      throw new Error(`Page ${pageNumber} not available (PDF has ${images.length} pages)`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to convert PDF page ${pageNumber}:`, error);
    throw error;
  }
}