
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
  
  // Check direct matches in our hardcoded URLs
  if (HARDCODED_URLS[citation]) {
    console.log('✅ Found hardcoded URL:', HARDCODED_URLS[citation]);
    return HARDCODED_URLS[citation];
  }
  
  // Check for Business & Commerce Code patterns
  if (citation.includes("541.001") || citation.includes("Chapter 541")) {
    console.log('✅ Matched Business & Commerce Code Chapter 541');
    return "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.541.htm";
  }
  
  if (citation.includes("2.313") || citation.includes("Chapter 2")) {
    console.log('✅ Matched Business & Commerce Code Chapter 2 (Warranties)');
    return "https://statutes.capitol.texas.gov/Docs/BC/htm/BC.2.htm";
  }
  
  // Check for section 101.021 which is a common Texas code reference
  if (citation.includes("101.021")) {
    console.log('✅ Matched Civil Practice & Remedies Code 101.021');
    return "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm";
  }
  
  // Check for Wal-Mart case with Wright
  if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("wright")) {
    console.log('✅ Matched Wal-Mart v. Wright case');
    return "https://caselaw.findlaw.com/tx-supreme-court/1372854.html";
  }
  
  // Check for Wal-Mart case with Gonzalez
  if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("gonzalez")) {
    console.log('✅ Matched Wal-Mart v. Gonzalez case');
    return "https://caselaw.findlaw.com/tx-supreme-court/1031086.html";
  }
  
  console.log('❌ No direct URL found for citation');
  return null;
};
