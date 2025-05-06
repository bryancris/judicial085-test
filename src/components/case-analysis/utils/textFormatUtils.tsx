import React from "react";

/**
 * Highlights search terms in text
 * @param text The text to search within
 * @param searchTerm The term to highlight
 * @returns React elements with highlighted search terms
 */
export const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm) return text;
  
  // Simple split/join approach for highlighting
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === searchTerm.toLowerCase() 
      ? <mark key={i} className="bg-yellow-200">{part}</mark> 
      : part
  );
};

/**
 * Highlights search terms in HTML content
 * @param htmlContent The HTML content to process
 * @param term The search term to highlight
 * @returns HTML string with highlighted search terms
 */
export const highlightLawLinksWithSearch = (htmlContent: string, term: string): string => {
  if (!term) return htmlContent;
  
  // Split the content at HTML tags and then only highlight text content
  const tagSplit = htmlContent.split(/(<[^>]*>)/g);
  
  return tagSplit.map(part => {
    // If this is an HTML tag, leave it untouched
    if (part.startsWith('<') && part.endsWith('>')) {
      return part;
    }
    
    // Otherwise it's text content, highlight search term
    const regex = new RegExp(`(${term})`, 'gi');
    return part.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }).join('');
};
