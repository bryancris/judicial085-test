
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// Import pdf-parse for proper PDF text extraction
const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');

// Robust PDF text extraction with library-based approach
export async function extractTextFromPdfBuffer(pdfData: Uint8Array): Promise<string> {
  try {
    console.log('Starting PDF text extraction with pdf-parse library...');
    
    // Convert Uint8Array to Buffer for pdf-parse
    const buffer = Buffer.from(pdfData);
    
    // Strategy 1: Use pdf-parse library (primary method)
    try {
      const pdfData = await pdfParse.default(buffer);
      
      if (pdfData && pdfData.text && pdfData.text.trim().length > 0) {
        console.log(`PDF-parse extraction successful: ${pdfData.text.length} characters`);
        return cleanAndValidateText(pdfData.text);
      }
    } catch (pdfParseError) {
      console.warn('PDF-parse failed, trying fallback methods:', pdfParseError);
    }
    
    // Strategy 2: Enhanced custom extraction for problematic PDFs
    const customExtracted = await customPdfExtraction(pdfData);
    if (customExtracted && customExtracted.length > 50) {
      console.log(`Custom extraction successful: ${customExtracted.length} characters`);
      return cleanAndValidateText(customExtracted);
    }
    
    // Strategy 3: Create meaningful document summary
    console.warn('All extraction methods failed, creating document summary');
    return createDocumentSummary(pdfData);
    
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    return `Document uploaded successfully - PDF processing encountered issues but the file is stored and accessible. Upload date: ${new Date().toISOString().split('T')[0]}`;
  }
}

// Enhanced custom PDF extraction as fallback
async function customPdfExtraction(pdfData: Uint8Array): Promise<string> {
  try {
    const pdfString = new TextDecoder('latin1', { fatal: false }).decode(pdfData);
    const textParts: string[] = [];
    
    // Extract text from PDF streams with better filtering
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Skip binary content
      if (streamContent.includes('\0') || streamContent.includes('%PDF')) {
        continue;
      }
      
      // Extract readable text
      const readableText = extractReadableContent(streamContent);
      if (readableText.length > 10) {
        textParts.push(readableText);
      }
    }
    
    // Extract text from BT/ET blocks
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/gi;
    while ((match = textObjectRegex.exec(pdfString)) !== null) {
      const textObject = match[1];
      const extractedText = extractFromTextOperations(textObject);
      if (extractedText.length > 5) {
        textParts.push(extractedText);
      }
    }
    
    return textParts.join(' ').trim();
  } catch (error) {
    console.warn('Custom extraction failed:', error);
    return '';
  }
}

// Extract readable content from PDF streams
function extractReadableContent(content: string): string {
  try {
    // Remove PDF operators and binary data
    let cleaned = content
      .replace(/[<>]/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\/[A-Za-z0-9]+/g, ' ')
      .replace(/\b\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+[a-zA-Z]+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Extract meaningful sentences
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !word.includes('@') // Filter out email artifacts temporarily
    );
    
    return words.join(' ').trim();
  } catch (error) {
    return '';
  }
}

// Extract text from PDF text operations
function extractFromTextOperations(textObject: string): string {
  try {
    const textParts: string[] = [];
    
    // Look for text show operations
    const showTextPatterns = [
      /\((.*?)\)\s*Tj/gi,
      /\((.*?)\)\s*TJ/gi,
      /\[(.*?)\]\s*TJ/gi
    ];
    
    for (const pattern of showTextPatterns) {
      let match;
      while ((match = pattern.exec(textObject)) !== null) {
        const text = cleanTextContent(match[1]);
        if (text && text.length > 1) {
          textParts.push(text);
        }
      }
    }
    
    return textParts.join(' ');
  } catch (error) {
    return '';
  }
}

// Clean and validate extracted text
function cleanTextContent(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\[nrtbf]/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Create meaningful document summary when extraction fails
function createDocumentSummary(pdfData: Uint8Array): string {
  try {
    const pdfString = new TextDecoder('latin1', { fatal: false }).decode(pdfData);
    
    let summary = 'PDF Document';
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Try to extract basic metadata
    const titleMatch = pdfString.match(/\/Title\s*\((.*?)\)/);
    if (titleMatch && titleMatch[1]) {
      const title = cleanTextContent(titleMatch[1]);
      if (title.length > 0 && title.length < 100) {
        summary = title;
      }
    }
    
    // Look for email indicators
    const emailMatch = pdfString.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      summary = 'Email Communication';
    }
    
    return `${summary} - Uploaded ${currentDate}. Document stored successfully and available for review.`;
  } catch (error) {
    return `PDF Document - Uploaded ${new Date().toISOString().split('T')[0]}. Content requires manual review.`;
  }
}

// Enhanced text validation and cleaning
function cleanAndValidateText(text: string): string {
  if (!text) return '';
  
  try {
    // Basic cleaning
    let cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .trim();
    
    // Remove excessive repetition
    cleaned = cleaned.replace(/(\b\w+\b)(\s+\1){3,}/g, '$1');
    
    // Quality validation
    const words = cleaned.split(/\s+/);
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      /^[a-zA-Z]/.test(word) &&
      !/^[^@]*@[^@]*$/.test(word) // Filter obvious email artifacts
    );
    
    // If too few meaningful words, return a summary
    if (meaningfulWords.length < 10) {
      return `Document content extracted but requires review. Contains ${words.length} text elements. Uploaded ${new Date().toISOString().split('T')[0]}.`;
    }
    
    // Limit length
    if (cleaned.length > 8000) {
      cleaned = cleaned.substring(0, 8000) + '... [Content truncated for processing]';
    }
    
    return cleaned;
  } catch (error) {
    console.warn('Text validation failed:', error);
    return text.substring(0, 1000);
  }
}

// Improved document chunking with better content detection
export function chunkDocument(content: string): string[] {
  try {
    console.log(`Starting intelligent chunking for ${content.length} characters`);
    
    if (content.length < 100) {
      console.log('Content too short for chunking, returning as single chunk');
      return [content];
    }
    
    const MAX_CHUNK_SIZE = 1000;
    const chunks: string[] = [];
    
    // Try paragraph-based chunking first
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    
    if (paragraphs.length > 1) {
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        
        if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 200) {
          chunks.push(currentChunk.trim());
          currentChunk = trimmed;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
        }
      }
      
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
    
    // Fallback to sentence-based chunking
    if (chunks.length === 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15);
      
      if (sentences.length > 0) {
        let currentChunk = '';
        
        for (const sentence of sentences) {
          const trimmed = sentence.trim() + '.';
          
          if (currentChunk.length + trimmed.length > MAX_CHUNK_SIZE && currentChunk.length > 200) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmed;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + trimmed;
          }
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }
    }
    
    // Final fallback to character-based chunking
    if (chunks.length === 0) {
      for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
        const chunk = content.slice(i, i + MAX_CHUNK_SIZE).trim();
        if (chunk.length > 50) {
          chunks.push(chunk);
        }
      }
    }
    
    const validChunks = chunks.filter(chunk => chunk.length > 30);
    
    if (validChunks.length === 0) {
      console.warn('No valid chunks created, returning original content');
      return [content];
    }
    
    console.log(`Intelligent chunking completed: ${validChunks.length} chunks created`);
    return validChunks;
    
  } catch (error: any) {
    console.error('Chunking error:', error);
    return [content];
  }
}
