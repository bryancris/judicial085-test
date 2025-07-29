/**
 * Utility functions for detecting and parsing legal citations in text
 */

// Comprehensive regex patterns for legal citations
const CITATION_PATTERNS = [
  // Docket numbers (prioritize these for CourtListener links) - more comprehensive patterns
  /(?:Docket\s+)?No\.\s+[\d-]+(?:[A-Z]{1,4})?(?:-[\d-]+)*(?:-[A-Z]{1,4})*(?:-[A-Z]{3,4})?/gi,
  /(?:Case\s+)?No\.\s+[\d-]+(?:[A-Z]{1,4})?(?:-[\d-]+)*(?:-[A-Z]{1,4})*(?:-[A-Z]{3,4})?/gi,
  /Docket\s+No\.\s+[\w-]+/gi,
  /Case\s+No\.\s+[\w-]+/gi,
  
  // Case citations with v. (versus)
  /\b[A-Z][a-zA-Z\s&.,-]+\s+v\.\s+[A-Z][a-zA-Z\s&.,-]+,?\s+\d+[\w\s.]+\d+/g,
  
  // Statute citations (Texas codes)
  /Texas\s+(?:Business\s+(?:and|&)\s+Commerce|Civil\s+Practice\s+(?:and|&)\s+Remedies|Property|Penal)\s+Code\s+(?:Section|§)\s+\d+\.\d+/gi,
  
  // Section references
  /(?:Section|§)\s+\d+\.\d+(?:\([a-z]\))?/gi,
  
  // Federal citations
  /\d+\s+U\.S\.C\.?\s+(?:§\s+)?\d+/gi,
  /\d+\s+F\.\s?(?:2d|3d)\s+\d+/gi,
  /\d+\s+S\.\s?Ct\.\s+\d+/gi,
  
  // Texas citations
  /\d+\s+S\.W\.\s?(?:2d|3d)\s+\d+/gi,
  /\d+\s+Tex\.\s+\d+/gi,
  
  // Citations in italics or asterisks
  /\*[^*]+v\.\s+[^*]+\*/gi,
  /_[^_]+v\.\s+[^_]+_/gi,
];

export interface DetectedCitation {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'case' | 'statute' | 'section' | 'docket' | 'unknown';
}

/**
 * Detect citations in text and return their positions
 */
export const detectCitations = (text: string): DetectedCitation[] => {
  const citations: DetectedCitation[] = [];
  
  CITATION_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const citationText = match[0].trim();
      
      // Skip if we already found this citation
      if (citations.some(c => c.text === citationText)) {
        continue;
      }
      
      // Determine citation type
      let type: DetectedCitation['type'] = 'unknown';
      if (citationText.toLowerCase().includes('docket no.') || citationText.toLowerCase().includes('case no.')) {
        type = 'docket';
      } else if (citationText.includes(' v. ')) {
        type = 'case';
      } else if (citationText.includes('Code') || citationText.includes('U.S.C.')) {
        type = 'statute';
      } else if (citationText.includes('Section') || citationText.includes('§')) {
        type = 'section';
      }
      
      citations.push({
        text: citationText,
        startIndex: match.index,
        endIndex: match.index + citationText.length,
        type
      });
    }
  });
  
  // Sort by position in text
  return citations.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Clean citation text by removing formatting markers
 */
export const cleanCitationText = (citation: string): string => {
  return citation
    .replace(/^\*+|\*+$/g, '') // Remove asterisks
    .replace(/^_+|_+$/g, '')   // Remove underscores
    .trim();
};

/**
 * Check if a citation is likely to be valid
 */
export const isValidCitation = (citation: string): boolean => {
  const cleanText = cleanCitationText(citation);
  
  // Docket numbers are always valid if they match the pattern - updated for more complex formats
  if (cleanText.toLowerCase().includes('docket no.') || cleanText.toLowerCase().includes('case no.') || /^no\.\s+[\w-]+/i.test(cleanText)) {
    return /(?:Docket\s+|Case\s+)?No\.\s+[\w-]+/i.test(cleanText);
  }
  
  // Must be at least 10 characters for other citations
  if (cleanText.length < 10) return false;
  
  // Case citations should have v.
  if (cleanText.includes(' v. ')) return true;
  
  // Statute citations should have specific patterns
  if (/(?:Code|U\.S\.C\.|§|Section)\s+\d+/i.test(cleanText)) return true;
  
  // Federal reporter citations
  if (/\d+\s+[A-Z]\.\s?(?:2d|3d)\s+\d+/.test(cleanText)) return true;
  
  return false;
};

/**
 * Extract the most important citations from text (limit to avoid overwhelming UI)
 */
export const extractKeyCitations = (text: string, maxCitations: number = 10): DetectedCitation[] => {
  const allCitations = detectCitations(text);
  
  // Filter valid citations
  const validCitations = allCitations.filter(c => isValidCitation(c.text));
  
  // Prioritize docket numbers first (most reliable for CourtListener), then case citations, then statutes, then sections
  const prioritized = validCitations.sort((a, b) => {
    const typeOrder = { docket: 0, case: 1, statute: 2, section: 3, unknown: 4 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
  
  return prioritized.slice(0, maxCitations);
};