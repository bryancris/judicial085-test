
// Stream processing utilities
import { cleanPdfTextEnhanced, isValidTextContent } from './textUtils.ts';

export function parseTextCommandsEnhanced(textCommands: string): string {
  const textParts: string[] = [];
  
  // Enhanced PDF text command patterns
  const patterns = [
    /\(([^)]{3,})\)\s*Tj/gi,
    /\(([^)]{3,})\)\s*TJ/gi,
    /\(([^)]{3,})\)\s*'/gi,
    /\(([^)]{3,})\)\s*"/gi,
    /\[(.*?)\]\s*TJ/gi,
    /"([^"]{3,})"/gi,
    /\/F\d+\s+[\d\.]+\s+Tf\s*\(([^)]{3,})\)/gi,
    /Td\s*\(([^)]{3,})\)/gi,
    /TD\s*\(([^)]{3,})\)/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(textCommands)) !== null) {
      const text = cleanPdfTextEnhanced(match[1]);
      if (text && isValidTextContent(text)) {
        textParts.push(text);
      }
    }
    pattern.lastIndex = 0; // Reset regex
  }
  
  return textParts.join(' ');
}

export function extractTextFromStream(streamData: string): string {
  const textParts: string[] = [];
  
  // Look for text patterns in stream
  const streamPatterns = [
    /BT\s*([\s\S]*?)\s*ET/gi,
    /\(([^)]{5,})\)/gi,
    /"([^"]{5,})"/gi
  ];
  
  for (const pattern of streamPatterns) {
    let match;
    while ((match = pattern.exec(streamData)) !== null) {
      const text = cleanPdfTextEnhanced(match[1]);
      if (text && isValidTextContent(text)) {
        textParts.push(text);
      }
    }
    pattern.lastIndex = 0;
  }
  
  return textParts.join(' ');
}

export function decodeASCII85(encoded: string): string {
  try {
    // Basic ASCII85 decoding (simplified)
    return encoded.replace(/[^\x21-\x75]/g, '');
  } catch {
    return '';
  }
}

export function decodeASCIIHex(encoded: string): string {
  try {
    const hex = encoded.replace(/[^0-9A-Fa-f]/g, '');
    const bytes = hex.match(/.{2}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
  } catch {
    return '';
  }
}
