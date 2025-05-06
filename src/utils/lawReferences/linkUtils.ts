
/**
 * Utility functions for creating law reference links
 */

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
};

/**
 * Create a React component-friendly law reference link props
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
