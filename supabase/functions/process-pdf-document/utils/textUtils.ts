
// Text processing utilities
export function cleanPdfTextEnhanced(text: string): string {
  if (!text) return '';
  
  return text
    // Handle escape sequences
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (match, octal) => {
      try {
        return String.fromCharCode(parseInt(octal, 8));
      } catch {
        return '';
      }
    })
    // Handle hex codes
    .replace(/<([0-9A-Fa-f]+)>/g, (match, hex) => {
      try {
        const bytes = hex.match(/.{2}/g) || [];
        return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
      } catch {
        return '';
      }
    })
    // Clean up whitespace and control characters
    .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
    .replace(/[^\x20-\x7E\s]/g, ' ')   // Keep only printable ASCII + whitespace
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .trim();
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
    /^.{1,2}$/         // Too short
  ];
  
  return !garbagePatterns.some(pattern => pattern.test(text));
}

export function calculateEnhancedQuality(text: string): number {
  if (!text || text.length < 5) return 0;
  
  // Check for legal content first (high priority)
  const legalTerms = [
    'REQUEST FOR PRODUCTION', 'DISCOVERY', 'INTERROGATORY',
    'DEFENDANT', 'PLAINTIFF', 'COURT', 'CASE', 'MOTION',
    'DEPOSITION', 'SUBPOENA', 'ATTORNEY', 'LEGAL'
  ];
  
  const upperText = text.toUpperCase();
  const hasLegalTerms = legalTerms.some(term => upperText.includes(term));
  
  if (hasLegalTerms) {
    console.log('✅ Enhanced quality: Legal terms detected');
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
  
  const quality = (meaningfulRatio * 0.6) + lengthBonus + diversityBonus;
  return Math.max(0, Math.min(1, quality));
}
