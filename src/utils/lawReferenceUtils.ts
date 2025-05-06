
/**
 * Utility functions for detecting and linking law references to the knowledge database
 */

import { supabase } from "@/integrations/supabase/client";
import { DocumentMetadataDetail } from "@/types/knowledge";

// Common Texas law citation patterns
const CITATION_PATTERNS = [
  // Texas Civil Practice and Remedies Code § 75.001
  /Texas\s+Civil\s+Practice\s+and\s+Remedies\s+Code\s+§\s+(\d+\.\d+)/gi,
  // Section 75.001
  /Section\s+(\d+\.\d+)/gi,
  // § 75.001
  /§\s+(\d+\.\d+)/gi,
  // Texas Civil Practice & Remedies Code
  /Texas\s+Civil\s+Practice\s+(?:and|&)\s+Remedies\s+Code/gi,
  // Texas Penal Code Section 123
  /Texas\s+([A-Za-z]+)\s+Code\s+(?:Section|§)\s+(\d+)/gi,
  // Case law citations like *Wal-Mart Stores, Inc. v. Gonzalez*
  /\*([^*]+v\.\s+[^*]+)\*/gi,
  // Wal-Mart Stores, Inc. v. Wright (without asterisks)
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Wright/gi,
  // Wal-Mart Stores, Inc. v. Gonzalez (without asterisks)
  /Wal-Mart\s+Stores,\s+Inc\.\s+v\.\s+Gonzalez/gi,
  // Citations with § symbol followed by numbers (like § 101.021)
  /§\s+\d+\.\d+/gi,
];

/**
 * Search for law documents in the vector database
 * @param searchTerm The search term to query
 * @returns Promise with the search results
 */
export const searchLawDocuments = async (searchTerm: string): Promise<{
  id: string;
  title: string | null;
  url: string | null;
}[]> => {
  try {
    console.log(`Searching for document: "${searchTerm}"`);
    
    // First try to find documents in document_metadata which might have direct PDF URLs
    const { data: metadataResults, error: metadataError } = await supabase
      .from('document_metadata')
      .select('id, title, url')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(3);
    
    if (metadataError) {
      console.error("Error searching document metadata:", metadataError);
    }
    
    // If we found direct metadata with URLs, use those
    if (metadataResults && metadataResults.length > 0) {
      console.log(`Found ${metadataResults.length} direct metadata results with URLs`);
      return metadataResults.map(doc => ({
        id: doc.id,
        title: doc.title || "Texas Law Document",
        url: doc.url
      }));
    }
    
    // Fallback to searching in the documents table
    const { data: documents, error: searchError } = await supabase
      .from('documents')
      .select('id, metadata')
      .textSearch('content', searchTerm, { type: 'plain' })
      .limit(3);

    if (searchError) {
      console.error("Error in text search:", searchError);
      return [];
    }

    console.log(`Found ${documents?.length || 0} documents in content search`);

    // Map the results to the expected format
    return (documents || []).map(doc => {
      const metadata = doc.metadata as DocumentMetadataDetail;
      return {
        id: metadata?.file_id || String(doc.id),
        title: metadata?.title || metadata?.file_title || "Texas Law Document",
        url: metadata?.file_path || null
      };
    });
  } catch (error) {
    console.error("Exception in searchLawDocuments:", error);
    return [];
  }
};

/**
 * Creates a clickable link for a law reference
 * @param citation The full citation text
 * @param url Optional direct URL to the document
 * @param displayText Optional text to display instead of the citation
 * @returns HTML string with the link
 */
export const createLawLink = (citation: string, url?: string | null, displayText?: string): string => {
  const display = displayText || citation;
  
  // If we have a direct URL (likely a PDF), create a direct link to it
  if (url) {
    return `<a href="${url}" class="text-blue-600 hover:underline hover:text-blue-800 inline-flex items-center" target="_blank" rel="noopener noreferrer">${display} <span class="ml-1 inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span></a>`;
  }
  
  // Fallback to search in the knowledge base
  const encodedSearch = encodeURIComponent(citation);
  return `<a href="/knowledge?search=${encodedSearch}" class="text-blue-600 hover:underline hover:text-blue-800 inline-flex items-center" target="_blank">${display} <span class="ml-1 inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span></a>`;
}

/**
 * Process text to identify and convert law references to clickable links
 * This now returns a Promise since we need to look up URLs asynchronously
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
      // Handle special case for commonly referenced citations
      let directUrl = null;
      
      // Check for section 101.021 which is a common Texas code reference
      if (citation.includes("101.021")) {
        directUrl = "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm";
      }
      // Check for Wal-Mart case with Wright
      else if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("wright")) {
        directUrl = "https://caselaw.findlaw.com/tx-supreme-court/1372854.html";
      }
      // Check for Wal-Mart case with Gonzalez
      else if (citation.toLowerCase().includes("wal-mart") && citation.toLowerCase().includes("gonzalez")) {
        directUrl = "https://caselaw.findlaw.com/tx-supreme-court/1031086.html";
      }
      
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
  
  // Add hardcoded URLs for common citations
  const hardcodedUrls: Record<string, string> = {
    "§ 101.021": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.101.htm",
    "Texas Civil Practice and Remedies Code": "https://statutes.capitol.texas.gov/Docs/CP/htm/CP.75.htm",
    "Wal-Mart Stores, Inc. v. Wright": "https://caselaw.findlaw.com/tx-supreme-court/1372854.html",
    "Wal-Mart Stores, Inc. v. Gonzalez": "https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
  };
  
  // Apply hardcoded URLs first
  Object.entries(hardcodedUrls).forEach(([citation, url]) => {
    const regex = new RegExp(citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    processedText = processedText.replace(regex, (match) => {
      return createLawLink(match, url);
    });
  });
  
  // Then process remaining citations
  CITATION_PATTERNS.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => {
      // Check if this citation already has a hardcoded URL
      for (const [citation, _] of Object.entries(hardcodedUrls)) {
        if (match.includes(citation)) {
          // Skip this match as it was already processed
          return match;
        }
      }
      // Process this citation with a standard link
      return createLawLink(match);
    });
  });
  
  return processedText;
};

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
 * Create a React component-friendly law reference link
 * This function interfaces with our LawReferenceLink component
 * @param citation The citation text
 * @param url Optional direct URL to the document
 * @returns LawReferenceLink component properties
 */
export const createLawReferenceLinkProps = (
  citation: string, 
  url?: string | null
): { citation: string; url?: string | null } => {
  return { citation, url };
};
