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
    // First try to find documents in document_metadata which might have direct PDF URLs
    const { data: metadataResults, error: metadataError } = await supabase
      .from('document_metadata')
      .select('id, title, url')
      .textSearch('title', searchTerm, { type: 'plain' })
      .limit(3);
    
    if (metadataError) {
      console.error("Error searching document metadata:", metadataError);
    }
    
    // If we found direct metadata with URLs, use those
    if (metadataResults && metadataResults.length > 0) {
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
  
  // If we have a direct URL (likely a PDF), use it
  if (url) {
    return `<a href="${url}" class="text-blue-600 hover:underline hover:text-blue-800 flex items-center" target="_blank" rel="noopener noreferrer">${display} <span class="ml-1 inline-block text-xs">📄</span></a>`;
  }
  
  // Fallback to search in the knowledge base
  const encodedSearch = encodeURIComponent(citation);
  return `<a href="/knowledge?search=${encodedSearch}" class="text-blue-600 hover:underline hover:text-blue-800 flex items-center" target="_blank">${display} <span class="ml-1 inline-block text-xs">🔍</span></a>`;
};

/**
 * Process text to identify and convert law references to clickable links
 * This now returns a Promise since we need to look up URLs asynchronously
 * @param text The text to process
 * @returns Promise with the processed text with law references converted to links
 */
export const processLawReferences = async (text: string): Promise<string> => {
  let processedText = text;
  const citations = extractCitations(text);
  
  // For each citation, try to find a direct URL
  for (const citation of citations) {
    try {
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

/**
 * Create a React component-friendly law reference link
 * @param citation The citation text
 * @param url Optional direct URL to the document
 * @returns React JSX for the link
 */
export const LawReferenceLink = ({ 
  citation, 
  url 
}: { 
  citation: string; 
  url?: string | null 
}): JSX.Element => {
  // If we have a direct URL, use it, otherwise use the search page
  const href = url || `/knowledge?search=${encodeURIComponent(citation)}`;
  const icon = url ? "📄" : "🔍";
  
  return (
    <a 
      href={href} 
      className="text-blue-600 hover:underline hover:text-blue-800 flex items-center" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {citation} <span className="ml-1 inline-block text-xs">{icon}</span>
    </a>
  );
};
