/**
 * Main law reference processing functions
 */

import { createLawLink } from "./linkUtils";
import { extractCitations, getDirectUrlForCitation } from "./citationUtils";
import { searchLawDocuments } from "./searchUtils";
import { CITATION_PATTERNS, HARDCODED_URLS } from "./citationPatterns";
import { formatCitationWithContext } from "./consumerProtectionUtils";

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
      // Format citation with proper context
      const formattedCitation = formatCitationWithContext(citation);
      
      // First check for known direct URLs
      let directUrl = getDirectUrlForCitation(citation);
      
      // If we have a direct URL already, use it
      if (directUrl) {
        const linkHtml = createLawLink(formattedCitation, directUrl);
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
        const linkHtml = createLawLink(formattedCitation, results[0].url);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      } else {
        // Otherwise, create a link to the knowledge search page
        const linkHtml = createLawLink(formattedCitation);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      }
    } catch (error) {
      console.error(`Error processing citation ${citation}:`, error);
      // If there's an error, still create a link, but to the search page with formatted citation
      const formattedCitation = formatCitationWithContext(citation);
      const linkHtml = createLawLink(formattedCitation);
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
  console.log('🔄 Processing law references in text:', text.substring(0, 200) + '...');
  let processedText = text;
  
  // Extract citations first to see what we're working with
  const extractedCitations = extractCitations(text);
  console.log('📊 Extracted citations:', extractedCitations);
  
  // Apply hardcoded URLs first
  Object.entries(HARDCODED_URLS).forEach(([citation, url]) => {
    const regex = new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matchesBefore = processedText.match(regex);
    if (matchesBefore) {
      console.log(`🔗 Applying hardcoded URL for: ${citation} -> ${url}`);
      console.log(`Found matches:`, matchesBefore);
    }
    processedText = processedText.replace(regex, (match) => {
      const formattedMatch = formatCitationWithContext(match);
      console.log(`✅ Hardcoded replacement: ${match} -> ${formattedMatch}`);
      return createLawLink(formattedMatch, url);
    });
  });
  
  // Then process remaining citations
  CITATION_PATTERNS.forEach((pattern, index) => {
    console.log(`🎯 Processing pattern ${index}:`, pattern.toString());
    const matchesBefore = [...processedText.matchAll(new RegExp(pattern))];
    if (matchesBefore.length > 0) {
      console.log(`Found ${matchesBefore.length} matches for pattern ${index}:`, matchesBefore.map(m => m[0]));
    }
    
    processedText = processedText.replace(pattern, (match) => {
      console.log(`🔍 Pattern ${index} processing match: ${match}`);
      
      // Check if this citation already has a hardcoded URL
      for (const [citation, _] of Object.entries(HARDCODED_URLS)) {
        if (match.includes(citation)) {
          console.log(`⚠️ Match already processed by hardcoded URL: ${citation}`);
          return match;
        }
      }
      
      // Format citation with proper context
      const formattedMatch = formatCitationWithContext(match);
      console.log(`📝 Formatted match: ${match} -> ${formattedMatch}`);
      
      // Check for known direct URLs
      const directUrl = getDirectUrlForCitation(match);
      console.log(`🔍 Direct URL for ${match}:`, directUrl);
      
      if (directUrl) {
        const result = createLawLink(formattedMatch, directUrl);
        console.log(`✅ Created direct link:`, result);
        return result;
      }
      
      // Process this citation with a standard link
      const result = createLawLink(formattedMatch);
      console.log(`✅ Created standard link:`, result);
      return result;
    });
  });
  
  console.log('🎉 Final processed text:', processedText.substring(0, 300) + '...');
  return processedText;
};
