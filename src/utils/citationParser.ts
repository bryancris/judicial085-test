/**
 * Utility functions for detecting and parsing legal citations in text
 */

// Only detect docket numbers for CourtListener links
const CITATION_PATTERNS = [
  // Precise docket number patterns - captures complete docket numbers including complex suffixes
  /(?:Docket|Case)\s+No\.\s+[\d-]+(?:-[A-Z]{2,4})?(?:,|\.)?/gi,
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
      
      // All detected citations are docket numbers since we only look for those
      let type: DetectedCitation['type'] = 'docket';
      
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
  
  // Since we only detect docket numbers now, just validate the docket pattern
  return /(?:Docket|Case)\s+No\.\s+[\d-]+(?:-[A-Z]{2,4})?/i.test(cleanText);
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