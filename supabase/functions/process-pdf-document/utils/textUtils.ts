
// Text processing utilities with enhanced legal document support

export function cleanPdfTextEnhanced(text: string): string {
  if (!text) return '';
  
  try {
    let cleaned = text;
    
    // Handle PDF escape sequences
    cleaned = cleaned
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\(\d{3})/g, (match, octal) => {
        try {
          const charCode = parseInt(octal, 8);
          return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
        } catch {
          return ' ';
        }
      });
    
    // Handle hex codes more carefully
    cleaned = cleaned.replace(/<([0-9A-Fa-f]+)>/g, (match, hex) => {
      try {
        if (hex.length % 2 !== 0) return ' ';
        const bytes = hex.match(/.{2}/g) || [];
        return bytes.map(byte => {
          const charCode = parseInt(byte, 16);
          return charCode >= 32 && charCode <= 126 ? String.fromCharCode(charCode) : ' ';
        }).join('');
      } catch {
        return ' ';
      }
    });
    
    // Clean up control characters and normalize whitespace
    cleaned = cleaned
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/[^\x20-\x7E\s\t\n\r]/g, ' ') // Keep only safe characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    return cleaned;
  } catch (error) {
    console.warn('Error cleaning PDF text:', error);
    // Ultra-safe fallback
    return text
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export function isValidTextContent(text: string): boolean {
  if (!text || text.length < 3) return false;
  
  // Check for reasonable character distribution
  const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalCount = text.length;
  const alphaRatio = alphaCount / totalCount;
  
  // Must have at least 30% alphabetic characters
  if (alphaRatio < 0.3) return false;
  
  // Reject obvious garbage patterns
  const garbagePatterns = [
    /^[A-Z\s]{20,}$/,  // Too many capitals
    /^\d+$/,           // Only numbers
    /^[^\w\s]+$/,      // Only special characters
    /^.{1,2}$/,        // Too short
    /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64-like
    /^[0-9A-Fa-f]{20,}$/          // Hex-like
  ];
  
  return !garbagePatterns.some(pattern => pattern.test(text));
}

export function calculateEnhancedQuality(text: string): number {
  if (!text || text.length < 5) return 0;
  
  // Check for legal content first (high priority)
  const legalTerms = [
    'ATTORNEYS', 'COUNSELORS', 'LAW', 'FIRM', 'PLLC',
    'REQUEST FOR PRODUCTION', 'DISCOVERY', 'INTERROGATORY',
    'DEFENDANT', 'PLAINTIFF', 'COURT', 'CASE', 'MOTION',
    'DEPOSITION', 'SUBPOENA', 'ATTORNEY', 'LEGAL',
    'VIA CERTIFIED MAIL', 'DEAR', 'SINCERELY', 'RE:'
  ];
  
  const upperText = text.toUpperCase();
  const hasLegalTerms = legalTerms.some(term => upperText.includes(term));
  
  if (hasLegalTerms) {
    console.log('✅ Enhanced quality: Legal document content detected');
    return Math.min(0.9, 0.7 + (text.length / 1000) * 0.2);
  }
  
  // Calculate based on content characteristics
  const words = text.split(/\s+/).filter(word => word.length > 2);
  if (words.length === 0) return 0;
  
  const meaningfulWords = words.filter(word => 
    /^[a-zA-Z]/.test(word) && word.length > 1
  );
  
  const meaningfulRatio = meaningfulWords.length / words.length;
  const lengthBonus = Math.min(text.length / 500, 0.3);
  const diversityBonus = new Set(words.map(w => w.toLowerCase())).size / words.length * 0.2;
  
  // Check for proper sentences
  const sentences = text.match(/[.!?]+/g) || [];
  const sentenceBonus = Math.min(sentences.length / 5, 0.2);
  
  const quality = (meaningfulRatio * 0.4) + lengthBonus + diversityBonus + sentenceBonus;
  return Math.max(0, Math.min(1, quality));
}
