
// Enhanced text object extraction with proper legal document handling

import { cleanPdfTextEnhanced, isValidTextContent, calculateEnhancedQuality } from '../utils/textUtils.ts';
import { parseTextCommandsEnhanced } from '../utils/streamUtils.ts';

export async function extractFromTextObjectsEnhanced(pdfData: Uint8Array, structure: any): Promise<{
  text: string;
  method: string;
  quality: number;
  confidence: number;
  pageCount: number;
}> {
  console.log('=== ENHANCED TEXT OBJECT EXTRACTION ===');
  
  try {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfData);
    
    const extractedTexts: string[] = [];
    let textObjectCount = 0;
    
    // Enhanced text object pattern with timeout protection
    const textObjectPattern = /BT\s*([\s\S]*?)\s*ET/gi;
    const maxIterations = 200; // Prevent infinite loops
    let iterationCount = 0;
    
    let match;
    while ((match = textObjectPattern.exec(pdfString)) !== null && iterationCount < maxIterations) {
      iterationCount++;
      textObjectCount++;
      
      const textObjectContent = match[1];
      if (!textObjectContent || textObjectContent.length < 5) continue;
      
      // Skip if this looks like binary/encoded data
      if (isBinaryData(textObjectContent)) {
        console.log(`Skipping binary data in text object ${textObjectCount}`);
        continue;
      }
      
      const extractedText = parseTextCommands(textObjectContent);
      
      if (extractedText && extractedText.length > 10) {
        // Additional validation for legal content
        if (isLegalContent(extractedText) || isReadableText(extractedText)) {
          extractedTexts.push(extractedText);
          console.log(`✅ Extracted valid text from object ${textObjectCount}: "${extractedText.substring(0, 100)}..."`);
        } else {
          console.log(`❌ Rejected non-readable text from object ${textObjectCount}`);
        }
      }
      
      // Early termination if we have enough good content
      if (extractedTexts.length > 50 && extractedTexts.join(' ').length > 5000) {
        console.log('✅ Found sufficient content, stopping early');
        break;
      }
    }
    
    console.log(`Processed ${textObjectCount} text objects, extracted ${extractedTexts.length} valid texts`);
    
    if (extractedTexts.length === 0) {
      console.warn('No valid text extracted from text objects');
      return {
        text: '',
        method: 'enhanced-text-objects',
        quality: 0,
        confidence: 0,
        pageCount: structure.pageCount || 1
      };
    }
    
    // Combine and clean the extracted text
    const combinedText = extractedTexts.join(' ').trim();
    const cleanedText = cleanPdfTextEnhanced(combinedText);
    const quality = calculateEnhancedQuality(cleanedText);
    
    console.log(`✅ Text object extraction completed: ${cleanedText.length} chars, quality: ${quality}`);
    
    return {
      text: cleanedText,
      method: 'enhanced-text-objects',
      quality: quality,
      confidence: 0.8,
      pageCount: structure.pageCount || Math.max(1, Math.floor(textObjectCount / 10))
    };
    
  } catch (error) {
    console.error('Error in text object extraction:', error);
    return {
      text: '',
      method: 'enhanced-text-objects',
      quality: 0,
      confidence: 0,
      pageCount: 1
    };
  }
}

// Enhanced text command parsing with better legal document support
function parseTextCommands(textObject: string): string {
  const textParts: string[] = [];
  
  // Enhanced patterns for legal documents
  const textShowPatterns = [
    // Standard text show operations
    /\(([^)]{3,})\)\s*Tj/gi,
    /\(([^)]{3,})\)\s*TJ/gi,
    /\(([^)]{3,})\)\s*'/gi,
    /\(([^)]{3,})\)\s*"/gi,
    
    // Array text operations
    /\[(.*?)\]\s*TJ/gi,
    
    // Quote patterns for legal text
    /"([^"]{5,})"/gi,
    
    // Font and positioning with text
    /\/F\d+\s+[\d\.]+\s+Tf\s*\(([^)]{3,})\)/gi,
    /T[dm]\s*\(([^)]{3,})\)/gi
  ];
  
  for (const pattern of textShowPatterns) {
    let match;
    let patternCount = 0;
    const maxPatternMatches = 100; // Prevent infinite loops
    
    while ((match = pattern.exec(textObject)) !== null && patternCount < maxPatternMatches) {
      patternCount++;
      
      const rawText = match[1];
      if (!rawText || rawText.length < 3) continue;
      
      // Skip binary patterns
      if (isBinaryData(rawText)) continue;
      
      const cleanedText = cleanPdfTextEnhanced(rawText);
      if (cleanedText && isValidTextContent(cleanedText)) {
        textParts.push(cleanedText);
      }
    }
    
    // Reset regex lastIndex to prevent issues
    pattern.lastIndex = 0;
  }
  
  return textParts.join(' ').trim();
}

// Check if content is binary/encoded data
function isBinaryData(text: string): boolean {
  if (!text || text.length < 3) return true;
  
  // Check for high ratio of non-printable characters
  const nonPrintableCount = (text.match(/[\x00-\x1F\x7F-\xFF]/g) || []).length;
  const nonPrintableRatio = nonPrintableCount / text.length;
  
  if (nonPrintableRatio > 0.5) return true;
  
  // Check for encoded data patterns
  const binaryPatterns = [
    /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64-like
    /^[0-9A-Fa-f]{20,}$/,         // Hex-like
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]{5,}/, // Control characters
    /[^\x20-\x7E\s\t\n\r]{10,}/   // Non-ASCII sequences
  ];
  
  return binaryPatterns.some(pattern => pattern.test(text));
}

// Check if text contains legal content indicators
function isLegalContent(text: string): boolean {
  const legalTerms = [
    'THE', 'FIRM', 'ATTORNEYS', 'COUNSELORS', 'LAW',
    'PLAINTIFF', 'DEFENDANT', 'COURT', 'CASE',
    'MOTION', 'BRIEF', 'DISCOVERY', 'DEPOSITION',
    'CONTRACT', 'AGREEMENT', 'WHEREAS', 'PARTY',
    'HEREBY', 'ATTORNEY', 'LEGAL', 'COUNSEL',
    'RE:', 'Dear', 'Sincerely', 'Respectfully',
    'VIA', 'CERTIFIED', 'MAIL', 'FAX'
  ];
  
  const upperText = text.toUpperCase();
  return legalTerms.some(term => upperText.includes(term));
}

// Check if text is generally readable
function isReadableText(text: string): boolean {
  if (!text || text.length < 5) return false;
  
  // Check for reasonable character distribution
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const total = text.length;
  const letterRatio = letters / total;
  
  // Should have at least 40% letters for readable text
  if (letterRatio < 0.4) return false;
  
  // Check for common English words
  const commonWords = ['the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'by', 'from', 'this', 'that'];
  const lowerText = text.toLowerCase();
  const hasCommonWords = commonWords.some(word => lowerText.includes(word));
  
  return hasCommonWords || isLegalContent(text);
}
