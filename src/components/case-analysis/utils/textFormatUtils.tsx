import React from "react";
import { enhanceConsumerProtectionAnalysis } from "@/utils/lawReferences/consumerProtectionUtils";
import { extractCitations } from "@/utils/citationEnhancer";
import { isStatuteCitation } from "@/utils/statuteSummaries";

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
  if (!term) {
    // Even without a search term, enhance the content with better citation formatting
    return enhanceCitationFormatting(enhanceConsumerProtectionAnalysis(htmlContent));
  }
  
  // First enhance the content with better citation formatting
  let enhancedContent = enhanceCitationFormatting(enhanceConsumerProtectionAnalysis(htmlContent));
  
  // Split the content at HTML tags and then only highlight text content
  const tagSplit = enhancedContent.split(/(<[^>]*>)/g);
  
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

/**
 * Enhance citation formatting in HTML content
 */
const enhanceCitationFormatting = (htmlContent: string): string => {
  // Extract citations to understand what we're working with
  const citationMatches = extractCitations(htmlContent);
  
  let enhanced = htmlContent;
  
  // Process each citation match
  citationMatches.forEach(match => {
    const { citation } = match;
    const isStatute = isStatuteCitation(citation);
    
    // Create appropriate styling for different citation types
    if (isStatute) {
      // Blue styling for statutes
      const styledCitation = `<span class="statute-citation text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-700">${citation}</span>`;
      enhanced = enhanced.replace(citation, styledCitation);
    } else {
      // Green styling for case law
      const styledCitation = `<span class="case-citation text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded border border-green-200 dark:border-green-700">${citation}</span>`;
      enhanced = enhanced.replace(citation, styledCitation);
    }
  });
  
  return enhanced;
};
