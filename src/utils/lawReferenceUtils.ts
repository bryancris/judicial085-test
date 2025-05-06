
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
    // Since we can't directly use the embedding function in the match_documents RPC,
    // let's use a text search instead
    const { data: documents, error: searchError } = await supabase
      .from('documents')
      .select('id, metadata')
      .textSearch('content', searchTerm, { type: 'plain' })
      .limit(3);

    if (searchError) {
      console.error("Error in text search:", searchError);
      return [];
    }

    // Map the results to the expected format
    return (documents || []).map(doc => {
      const metadata = doc.metadata as DocumentMetadataDetail;
      return {
        id: metadata?.file_id || String(doc.id),
        title: metadata?.title || metadata?.file_title || "Texas Law Document",
        url: metadata?.file_path || `/knowledge/${doc.id}`
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
 * @param displayText Optional text to display instead of the citation
 * @returns HTML string with the link
 */
export const createLawLink = (citation: string, displayText?: string): string => {
  const encodedSearch = encodeURIComponent(citation);
  const display = displayText || citation;
  return `<a href="/knowledge?search=${encodedSearch}" class="text-blue-600 hover:underline hover:text-blue-800 flex items-center" target="_blank">${display} <span class="ml-1 inline-block text-xs">📄</span></a>`;
};

/**
 * Process text to identify and convert law references to clickable links
 * @param text The text to process
 * @returns The processed text with law references converted to links
 */
export const processLawReferences = (text: string): string => {
  let processedText = text;
  
  // Apply each citation pattern
  CITATION_PATTERNS.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => {
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
