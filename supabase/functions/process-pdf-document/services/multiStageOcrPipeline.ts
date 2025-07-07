// Multi-stage OCR pipeline that tries different services in order of effectiveness

import { extractTextWithGoogleDocumentAI } from './googleCloudDocumentAiService.ts';
import { extractTextWithOpenAIVision } from '../openaiVisionService.ts';
import { extractTextWithTesseract } from './tesseractOcrService.ts';
import { convertPdfToImages } from '../pdfToImageService.ts';
import { convertPdfToImagesWithPdfJs } from './pdfJsImageService.ts';
import { preprocessImageForOCR, enhanceImageQuality, validateImageQuality } from './imagePreprocessingService.ts';

export interface OcrResult {
  text: string;
  confidence: number;
  method: string;
  stage: number;
  processingNotes: string;
  pageCount?: number;
  processingTime: number;
}

export async function processDocumentWithMultiStageOcr(
  pdfData: Uint8Array,
  fileName: string
): Promise<OcrResult> {
  console.log('🚀 === STARTING MULTI-STAGE OCR PIPELINE ===');
  console.log(`Processing: ${fileName} (${pdfData.length} bytes)`);
  
  const startTime = Date.now();
  let lastError = '';
  
  // Stage 1: Google Cloud Document AI (highest quality for documents)
  try {
    console.log('📋 STAGE 1: Attempting Google Cloud Document AI...');
    const result = await extractTextWithGoogleDocumentAI(pdfData);
    
    if (result.text.length > 50 && result.confidence > 0.7) {
      console.log('✅ STAGE 1 SUCCESS: Google Cloud Document AI extraction completed');
      return {
        text: result.text,
        confidence: result.confidence,
        method: 'google-cloud-document-ai',
        stage: 1,
        processingNotes: `Google Cloud Document AI: ${result.text.length} characters, confidence ${result.confidence.toFixed(2)}`,
        pageCount: result.pageCount,
        processingTime: Date.now() - startTime
      };
    } else {
      console.log('⚠️ STAGE 1: Google Cloud Document AI result insufficient, proceeding to Stage 2');
    }
  } catch (error) {
    console.log('⚠️ STAGE 1 FAILED: Google Cloud Document AI unavailable:', error.message);
    lastError = `Stage 1: ${error.message}`;
  }
  
  // Stage 2: Enhanced PDFShift + OpenAI Vision with image preprocessing
  try {
    console.log('🖼️ STAGE 2: Attempting enhanced PDFShift + OpenAI Vision...');
    
    // Convert PDF to images with high quality
    const { images, pageCount } = await convertPdfToImages(pdfData);
    
    if (images.length === 0) {
      throw new Error('No images generated from PDF');
    }
    
    // Process each image with enhancement
    const extractedTexts: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      console.log(`📄 Processing page ${i + 1}/${images.length} with image enhancement...`);
      
      // Validate and enhance image quality
      const qualityCheck = validateImageQuality(images[i]);
      console.log(`Image quality check: ${qualityCheck.isGoodQuality ? 'Good' : 'Needs improvement'}`);
      
      let processedImage = images[i];
      
      // Enhance image if needed
      if (!qualityCheck.isGoodQuality) {
        console.log('🔧 Enhancing image quality...');
        const enhancement = await enhanceImageQuality(images[i]);
        processedImage = enhancement.enhancedImage;
        console.log('Enhancements applied:', enhancement.improvements.join(', '));
      }
      
      // Preprocess image for OCR
      const preprocessed = await preprocessImageForOCR(processedImage);
      
      // Create a single-image PDF from the processed image for OpenAI Vision
      // Convert base64 image back to bytes for processing
      const imageResponse = await fetch(processedImage);
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBytes = new Uint8Array(imageArrayBuffer);
      
      console.log(`🖼️ Processing image ${i + 1} (${imageBytes.length} bytes) with OpenAI Vision...`);
      
      // Extract text with OpenAI Vision using actual image data
      const pageResult = await extractTextWithOpenAIVision(imageBytes);
      if (pageResult.text && pageResult.text.trim().length > 0) {
        extractedTexts.push(pageResult.text.trim());
        console.log(`✅ Page ${i + 1} Vision extraction: ${pageResult.text.length} characters`);
      } else {
        console.log(`⚠️ Page ${i + 1} Vision extraction returned no text`);
      }
    }
    
    const combinedText = extractedTexts.join('\n\n').trim();
    
    if (combinedText.length > 50) {
      const confidence = Math.min(0.85, extractedTexts.length > 0 ? 0.8 : 0.6);
      console.log('✅ STAGE 2 SUCCESS: Enhanced PDFShift + OpenAI Vision completed');
      return {
        text: combinedText,
        confidence: confidence,
        method: 'enhanced-pdfshift-openai-vision',
        stage: 2,
        processingNotes: `Enhanced OCR: ${combinedText.length} characters from ${pageCount} pages with image preprocessing`,
        pageCount: pageCount,
        processingTime: Date.now() - startTime
      };
    } else {
      console.log('⚠️ STAGE 2: Enhanced OCR result insufficient, proceeding to Stage 3');
    }
  } catch (error) {
    console.log('⚠️ STAGE 2 FAILED: Enhanced PDFShift + OpenAI Vision failed:', error.message);
    lastError = `Stage 2: ${error.message}`;
  }
  
  // Stage 3: PDF.js rendering + OpenAI Vision
  try {
    console.log('🎨 STAGE 3: Attempting PDF.js rendering + OpenAI Vision...');
    
    const { images, pageCount } = await convertPdfToImagesWithPdfJs(pdfData);
    
    if (images.length > 0) {
      // Use first few pages with PDF.js rendering
      const samplePages = images.slice(0, 3); // Limit to first 3 pages for performance
      const extractedTexts: string[] = [];
      
      for (let i = 0; i < samplePages.length; i++) {
        console.log(`🎨 Processing PDF.js rendered page ${i + 1} with OpenAI Vision...`);
        
        // Convert PDF.js rendered image to bytes for OpenAI Vision
        const imageResponse = await fetch(samplePages[i]);
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBytes = new Uint8Array(imageArrayBuffer);
        
        const pageResult = await extractTextWithOpenAIVision(imageBytes);
        if (pageResult.text && pageResult.text.trim().length > 0) {
          extractedTexts.push(pageResult.text.trim());
          console.log(`✅ PDF.js page ${i + 1}: ${pageResult.text.length} characters extracted`);
        }
      }
      
      const combinedText = extractedTexts.join('\n\n').trim();
      
      if (combinedText.length > 30) {
        console.log('✅ STAGE 3 SUCCESS: PDF.js + OpenAI Vision completed');
        return {
          text: combinedText,
          confidence: 0.7,
          method: 'pdfjs-openai-vision',
          stage: 3,
          processingNotes: `PDF.js rendering: ${combinedText.length} characters from ${samplePages.length} pages`,
          pageCount: pageCount,
          processingTime: Date.now() - startTime
        };
      }
    }
    
    console.log('⚠️ STAGE 3: PDF.js rendering insufficient, proceeding to Stage 4');
  } catch (error) {
    console.log('⚠️ STAGE 3 FAILED: PDF.js rendering failed:', error.message);
    lastError = `Stage 3: ${error.message}`;
  }
  
  // Stage 4: Tesseract.js fallback
  try {
    console.log('🔤 STAGE 4: Attempting Tesseract.js fallback...');
    
    // Try to get at least one image for Tesseract
    let imageToProcess = '';
    
    try {
      const { images } = await convertPdfToImages(pdfData);
      if (images.length > 0) {
        imageToProcess = images[0];
      }
    } catch {
      try {
        const { images } = await convertPdfToImagesWithPdfJs(pdfData);
        if (images.length > 0) {
          imageToProcess = images[0];
        }
      } catch {
        throw new Error('No images available for Tesseract processing');
      }
    }
    
    if (imageToProcess) {
      const result = await extractTextWithTesseract(imageToProcess);
      
      if (result.text.length > 20) {
        console.log('✅ STAGE 4 SUCCESS: Tesseract.js fallback completed');
        return {
          text: result.text,
          confidence: result.confidence,
          method: 'tesseract-fallback',
          stage: 4,
          processingNotes: `Tesseract fallback: ${result.text.length} characters, confidence ${result.confidence.toFixed(2)}`,
          pageCount: 1,
          processingTime: Date.now() - startTime
        };
      }
    }
    
    console.log('⚠️ STAGE 4: Tesseract fallback insufficient');
  } catch (error) {
    console.log('⚠️ STAGE 4 FAILED: Tesseract fallback failed:', error.message);
    lastError = `Stage 4: ${error.message}`;
  }
  
  // All stages failed
  console.error('❌ ALL OCR STAGES FAILED');
  console.error('Last error:', lastError);
  
  throw new Error(`All OCR methods failed. Last error: ${lastError}`);
}

export function selectOptimalOcrMethod(
  documentType: string,
  fileSize: number,
  availableServices: string[]
): string[] {
  console.log(`🎯 Selecting optimal OCR method for ${documentType} document (${fileSize} bytes)`);
  
  const methods: string[] = [];
  
  // For legal documents, prioritize Google Cloud Document AI
  if (documentType.includes('legal') || documentType.includes('demand')) {
    if (availableServices.includes('google-cloud-document-ai')) {
      methods.push('google-cloud-document-ai');
    }
  }
  
  // For large documents, use services that handle pagination well
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    methods.push('enhanced-pdfshift-openai-vision');
    methods.push('pdfjs-openai-vision');
  } else {
    // For smaller documents, all methods are viable
    methods.push('enhanced-pdfshift-openai-vision');
    methods.push('pdfjs-openai-vision');
    methods.push('tesseract-fallback');
  }
  
  console.log('Optimal method order:', methods);
  return methods;
}