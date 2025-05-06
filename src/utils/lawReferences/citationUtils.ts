
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
  const citations: string[] = [];
  
  CITATION_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(new RegExp(pattern));
    for (const match of matches) {
      citations.push(match[0]);
    }
  });
  
  return [...new Set(citations)]; // Remove duplicates
};

/**
 * Find a direct URL for a citation if one is known
 * @param citation The citation text
 * @returns URL if found, null otherwise
 */
export const getDirectUrlForCitation = (citation: string): string | null => {
  // Check direct matches in our hardcoded URLs
  if (HARDCODED_URLS[citation]) {
    return HARDCODED_URLS[citation];
  }
  
  // Check for section 101.021 which is a common Texas code reference
  if (citation.includes("101.021")) {
    return "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm";
  }
  
  // Check for Wal-Mart case with Wright
  if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("wright")) {
    return "https://caselaw.findlaw.com/tx-supreme-court/1372854.html";
  }
  
  // Check for Wal-Mart case with Gonzalez
  if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("gonzalez")) {
    return "https://caselaw.findlaw.com/tx-supreme-court/1031086.html";
  }
  
  return null;
};
