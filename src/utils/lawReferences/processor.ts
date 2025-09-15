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
 * Optimized version that prioritizes hardcoded URLs to avoid slow database calls
 * @param text The text to process
 * @returns Promise with the processed text with law references converted to links
 */
export const processLawReferences = async (text: string): Promise<string> => {
  // First, try synchronous processing which handles most cases with hardcoded URLs
  const syncResult = processLawReferencesSync(text);
  
  // Check if sync processing already handled all citations
  const remainingCitations = extractCitations(syncResult).filter(citation => {
    // Only process citations that don't have hardcoded URLs and weren't already processed
    return !getDirectUrlForCitation(citation) && !syncResult.includes(`href=`);
  });
  
  console.log("Citations needing database lookup:", remainingCitations);
  
  // If no citations need database lookup, return sync result immediately
  if (remainingCitations.length === 0) {
    console.log("All citations handled by hardcoded URLs, skipping database queries");
    return syncResult;
  }
  
  let processedText = syncResult;
  
  // Only do expensive database lookups for remaining citations with timeout
  for (const citation of remainingCitations) {
    try {
      const formattedCitation = formatCitationWithContext(citation);
      
      // Add timeout to prevent hanging on slow database queries
      const searchWithTimeout = Promise.race([
        searchLawDocuments(citation),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database search timeout')), 5000)
        )
      ]);
      
      const results = await searchWithTimeout;
      if (results.length > 0 && results[0].url) {
        const linkHtml = createLawLink(formattedCitation, results[0].url);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      } else {
        const linkHtml = createLawLink(formattedCitation);
        processedText = processedText.replace(
          new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 
          linkHtml
        );
      }
    } catch (error) {
      console.log(`Database lookup failed/timeout for ${citation}, using fallback link:`, error.message);
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
