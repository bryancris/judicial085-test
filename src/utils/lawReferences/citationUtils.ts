
/**
 * Utility functions for extracting and identifying legal citations
 */

import { CITATION_PATTERNS, HARDCODED_URLS } from "./citationPatterns";

/**
 * Extract citations from text for proactive fetching
 * @param text The text to analyze for citations
 * @returns Array of citation strings
 */
export const extractCitations = (text: string): string[] => {
  console.log('🔍 Extracting citations from text:', text.substring(0, 200) + '...');
  const citations: string[] = [];
  
  CITATION_PATTERNS.forEach((pattern, index) => {
    const matches = text.matchAll(new RegExp(pattern));
    for (const match of matches) {
      console.log(`✅ Pattern ${index} matched:`, match[0]);
      citations.push(match[0]);
    }
  });
  
  const uniqueCitations = [...new Set(citations)];
  console.log('📋 Final extracted citations:', uniqueCitations);
  return uniqueCitations;
};

/**
 * Find a direct URL for a citation if one is known
 * @param citation The citation text
 * @returns URL if found, null otherwise
 */
export const getDirectUrlForCitation = (citation: string): string | null => {
  console.log('🔍 Getting direct URL for citation:', citation);
  
  // Check direct matches in our hardcoded URLs (only exact matches for parenthetical citations)
  if (HARDCODED_URLS[citation]) {
    console.log('✅ Found hardcoded URL:', HARDCODED_URLS[citation]);
    return HARDCODED_URLS[citation];
  }
  
  console.log('❌ No direct URL found for citation');
  return null;
};
