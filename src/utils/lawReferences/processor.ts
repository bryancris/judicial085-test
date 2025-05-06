/**
 * Main law reference processing functions
 */

import { createLawLink } from "./linkUtils";
import { extractCitations, getDirectUrlForCitation } from "./citationUtils";
import { searchLawDocuments } from "./searchUtils";
import { CITATION_PATTERNS, HARDCODED_URLS } from "./citationPatterns";

/**
 * Process text to identify and convert law references to clickable links
 * This is an asynchronous function that looks up URLs for citations
 * @param text The text to process
 * @returns Promise with the processed text with law references converted to links
 */
export const processLawReferences = async (text: string): Promise<string> => {
  let processedText = text;
  const citations = extractCitations(text);
  
  console.log("Found citations:", citations);
  
  // For each citation, try to find a direct URL
  for (const citation of citations) {
    try {
      // First check for known direct URLs
      let directUrl = getDirectUrlForCitation(citation);
      
      // If we have a direct URL already, use it
      if (directUrl) {
        const linkHtml = createLawLink(citation, directUrl);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
        continue;
      }
      
      // Otherwise search for the document
      const results = await searchLawDocuments(citation);
      if (results.length > 0 && results[0].url) {
        // If we found a direct URL, create a link with it
        const linkHtml = createLawLink(citation, results[0].url);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      } else {
        // Otherwise, create a link to the knowledge search page
        const linkHtml = createLawLink(citation);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      }
    } catch (error) {
      console.error(`Error processing citation ${citation}:`, error);
      // If there's an error, still create a link, but to the search page
      const linkHtml = createLawLink(citation);
      processedText = processedText.replace(
        new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
        linkHtml
      );
    }
  }
  
  return processedText;
};

/**
 * A synchronous version of processLawReferences for backwards compatibility
 * This will work but won't look up direct URLs
 * @param text The text to process
 * @returns The processed text with law references converted to links (without direct URLs)
 */
export const processLawReferencesSync = (text: string): string => {
  let processedText = text;
  
  // Apply hardcoded URLs first
  Object.entries(HARDCODED_URLS).forEach(([citation, url]) => {
    const regex = new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    processedText = processedText.replace(regex, (match) => {
      return createLawLink(match, url);
    });
  });
  
  // Then process remaining citations
  CITATION_PATTERNS.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => {
      // Check if this citation already has a hardcoded URL
      for (const [citation, _] of Object.entries(HARDCODED_URLS)) {
        if (match.includes(citation)) {
          // Skip this match as it was already processed
          return match;
        }
      }
      
      // Check for known direct URLs
      const directUrl = getDirectUrlForCitation(match);
      if (directUrl) {
        return createLawLink(match, directUrl);
      }
      
      // Process this citation with a standard link
      return createLawLink(match);
    });
  });
  
  return processedText;
};
