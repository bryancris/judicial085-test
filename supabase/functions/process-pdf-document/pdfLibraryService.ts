
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// Library-based PDF text extraction using pdf-parse equivalent for Deno
export async function extractTextWithLibrary(pdfData: Uint8Array): Promise<{text: string, pageCount: number}> {
  console.log('Starting library-based PDF text extraction...');
  
  try {
    // For Deno, we'll use a different approach since pdf-parse isn't directly available
    // We'll implement a more robust PDF text extraction
    const buffer = Buffer.from(pdfData);
    
    // Parse PDF structure more reliably
    const pdfString = buffer.toString('binary');
    const textContent: string[] = [];
    let pageCount = 0;
    
    // Count pages by looking for page objects
    const pageMatches = pdfString.match(/\/Type\s*\/Page\b/gi);
    pageCount = pageMatches ? pageMatches.length : 1;
    
    // Extract text from content streams more reliably
    const contentStreamRegex = /stream\s*([\s\S]*?)\s*endstream/gi;
    let streamMatch;
    
    while ((streamMatch = contentStreamRegex.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1];
      
      // Skip binary streams (images, fonts, etc.)
      if (isBinaryStream(streamContent)) {
        continue;
      }
      
      // Extract text from PDF text operators
      const extractedText = extractTextFromPDFOperators(streamContent);
      if (extractedText && extractedText.length > 10) {
        textContent.push(extractedText);
      }
    }
    
    // Also try to extract from text objects
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/gi;
    let textMatch;
    
    while ((textMatch = textObjectRegex.exec(pdfString)) !== null) {
      const textObject = textMatch[1];
      const extractedText = parseTextOperators(textObject);
      if (extractedText && extractedText.length > 5) {
        textContent.push(extractedText);
      }
    }
    
    const combinedText = textContent.join(' ').trim();
    
    console.log(`Library extraction completed: ${combinedText.length} characters, ${pageCount} pages`);
    
    return {
      text: combinedText,
      pageCount: pageCount
    };
    
  } catch (error) {
    console.error('Library-based extraction failed:', error);
    throw new Error(`PDF library extraction failed: ${error.message}`);
  }
}

// Check if a stream contains binary data
function isBinaryStream(content: string): boolean {
  // Check for high percentage of non-printable characters
  const nonPrintable = content.match(/[\x00-\x08\x0B-\x1F\x7F-\xFF]/g);
  const totalLength = content.length;
  
  if (totalLength === 0) return true;
  
  const binaryRatio = nonPrintable ? nonPrintable.length / totalLength : 0;
  return binaryRatio > 0.3; // If more than 30% binary, skip
}

// Extract text using PDF text operators
function extractTextFromPDFOperators(content: string): string {
  const textParts: string[] = [];
  
  // Common PDF text operators
  const textOperators = [
    /\((.*?)\)\s*Tj/gi,           // Show text
    /\((.*?)\)\s*TJ/gi,           // Show text with spacing
    /\[(.*?)\]\s*TJ/gi,           // Show text array
    /"(.*?)"\s*Tj/gi,             // Show text (quoted)
    /\<(.*?)\>\s*Tj/gi            // Show text (hex)
  ];
  
  for (const operator of textOperators) {
    let match;
    while ((match = operator.exec(content)) !== null) {
      const text = cleanPDFText(match[1]);
      if (text && text.length > 1) {
        textParts.push(text);
      }
    }
  }
  
  return textParts.join(' ');
}

// Parse text operators more thoroughly
function parseTextOperators(textObject: string): string {
  const textParts: string[] = [];
  
  // Text positioning and showing operators
  const patterns = [
    // Standard text showing
    /\((.*?)\)\s*Tj/gi,
    /\((.*?)\)\s*TJ/gi,
    
    // Text arrays
    /\[(.*?)\]\s*TJ/gi,
    
    // Quoted strings
    /"(.*?)"\s*Tj/gi,
    
    // Hex strings
    /\<([0-9A-Fa-f]+)\>\s*Tj/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(textObject)) !== null) {
      let text = match[1];
      
      // Handle hex encoding
      if (pattern.toString().includes('A-Fa-f')) {
        text = hexToText(text);
      } else {
        text = cleanPDFText(text);
      }
      
      if (text && text.length > 1) {
        textParts.push(text);
      }
    }
  }
  
  return textParts.join(' ');
}

// Convert hex string to text
function hexToText(hex: string): string {
  try {
    let text = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (byte >= 32 && byte <= 126) { // Printable ASCII
        text += String.fromCharCode(byte);
      } else if (byte === 32) {
        text += ' ';
      }
    }
    return text;
  } catch (error) {
    return '';
  }
}

// Clean PDF text content
function cleanPDFText(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (match, octal) => {
      return String.fromCharCode(parseInt(octal, 8));
    })
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Validate extraction quality
export function validateLibraryExtraction(text: string, pageCount: number): {isValid: boolean, quality: number, issues: string[]} {
  const issues: string[] = [];
  let quality = 1.0;
  
  // Check text length
  if (text.length < 50) {
    issues.push('Extracted text too short');
    quality -= 0.4;
  }
  
  // Check for meaningful content
  const words = text.split(/\s+/);
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    /^[a-zA-Z]/.test(word)
  );
  
  const meaningfulRatio = words.length > 0 ? meaningfulWords.length / words.length : 0;
  
  if (meaningfulRatio < 0.3) {
    issues.push('Low ratio of meaningful words');
    quality -= 0.3;
  }
  
  // Check for excessive repetition
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const diversityRatio = words.length > 0 ? uniqueWords.size / words.length : 0;
  
  if (diversityRatio < 0.2) {
    issues.push('Highly repetitive content detected');
    quality -= 0.2;
  }
  
  // Check for garbage characters
  const garbageRatio = (text.match(/[^\x20-\x7E\s]/g) || []).length / text.length;
  if (garbageRatio > 0.1) {
    issues.push('High ratio of non-printable characters');
    quality -= 0.3;
  }
  
  const isValid = quality > 0.4 && issues.length < 3;
  
  return {
    isValid,
    quality: Math.max(0, quality),
    issues
  };
}
