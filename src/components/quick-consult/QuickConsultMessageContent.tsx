import React, { useEffect, useRef } from "react";
import { extractKeyCitations, cleanCitationText, extractCaseName } from "@/utils/citationParser";
import QuickConsultCitationLink from "./QuickConsultCitationLink";

interface QuickConsultMessageContentProps {
  content: string;
  enableCitationLinks?: boolean;
}

// Helper function to extract context around a citation for AI matching
const extractCitationContext = (content: string, startIndex: number, endIndex: number): string => {
  // Find the paragraph or sentence containing the citation
  const beforeText = content.substring(0, startIndex);
  const afterText = content.substring(endIndex);
  
  // Find sentence boundaries
  const sentenceStart = Math.max(
    beforeText.lastIndexOf('.'),
    beforeText.lastIndexOf('\n'),
    beforeText.lastIndexOf('?'),
    beforeText.lastIndexOf('!')
  );
  
  const sentenceEnd = Math.min(
    afterText.indexOf('.') + endIndex,
    afterText.indexOf('\n') + endIndex,
    afterText.indexOf('?') + endIndex,
    afterText.indexOf('!') + endIndex,
    content.length
  );
  
  const contextStart = sentenceStart > 0 ? sentenceStart + 1 : 0;
  const contextEnd = sentenceEnd > endIndex ? sentenceEnd : content.length;
  
  return content.substring(contextStart, contextEnd).trim();
};

// Helper function to remove duplicate content sections
const removeDuplicateContent = (text: string): string => {
  // Split content into paragraphs for better deduplication
  const paragraphs = text.split('\n\n');
  const result: string[] = [];
  const seenCases = new Set<string>();
  const seenContent = new Set<string>();
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;
    
    // Skip if we've seen this exact content before
    if (seenContent.has(trimmed)) {
      continue;
    }
    
    // Check for case names and skip duplicates
    const caseNameMatch = trimmed.match(/^\d+\.\s*([A-Za-z][^.\n]*(?:v\.?\s+[A-Za-z][^.\n]*)?)/);
    if (caseNameMatch) {
      const caseName = caseNameMatch[1].trim().toLowerCase();
      if (seenCases.has(caseName)) {
        continue; // Skip duplicate case
      }
      seenCases.add(caseName);
    }
    
    // Skip duplicate section headers
    if (trimmed.includes('**CASES**') || trimmed.includes('**Cases**')) {
      if (seenContent.has('cases-header')) {
        continue;
      }
      seenContent.add('cases-header');
    }
    
    seenContent.add(trimmed);
    result.push(paragraph);
  }
  
  return result.join('\n\n');
};

// Helper function to format case names with enhanced styling and verification badges
const formatCaseNames = (text: string): string => {
  // More robust pattern to match numbered case entries with their content
  const casePattern = /(\d+\.\s*)([A-Z][a-zA-Z\s&.,'-]+(?:\s+v\.?\s+[A-Z][a-zA-Z\s&.,'-]+)?[^.\n\d]*?)(?=\s*\n\s*\d+\.|\s*$)/g;
  
  return text.replace(casePattern, (match, number, content) => {
    // Check if this case is verified on CourtListener
    const isVerified = content.includes('[Verified on CourtListener]');
    
    // Split the content to identify the case name (first part before detailed description)
    const cleanContent = content.replace('[Verified on CourtListener]', '').trim();
    const parts = cleanContent.split(/[:\-–]/);
    const caseName = parts[0].trim().replace(/[,;:]+$/, '');
    const description = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
    
    // Add verification badge and clickable case button for verified cases
    let caseButton = '';
    if (isVerified) {
      caseButton = `<span class="inline-flex items-center ml-2">
        <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-2">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          Verified
        </span>
        <span class="citation-case-link cursor-pointer text-blue-600 hover:text-blue-800 hover:underline" data-case-name="${caseName.replace(/"/g, '&quot;')}" data-verified="true">
          ${caseName}
        </span>
      </span>`;
    } else {
      caseButton = caseName;
    }
    
    // Format with bold case name, verification badge, and add spacing after each case
    if (description) {
      return `${number}<span class="font-semibold text-base">${caseButton}</span>: ${description}<br/><br/>`;
    } else {
      return `${number}<span class="font-semibold text-base">${caseButton}</span><br/><br/>`;
    }
  });
};

const QuickConsultMessageContent: React.FC<QuickConsultMessageContentProps> = ({
  content,
  enableCitationLinks = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Clean up content first - remove duplicates and format case names
  const cleanedContent = removeDuplicateContent(content);
  const formattedContent = formatCaseNames(cleanedContent);

  // Add click handlers for verified case links
  useEffect(() => {
    if (!contentRef.current) return;

    const handleCaseClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const caseLink = target.closest('.citation-case-link');
      
      if (caseLink) {
        event.preventDefault();
        const caseName = caseLink.getAttribute('data-case-name');
        const isVerified = caseLink.getAttribute('data-verified') === 'true';
        
        if (caseName && isVerified) {
          // Open CourtListener search for verified cases
          const searchUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(caseName)}&type=o&court=all`;
          window.open(searchUrl, '_blank');
        }
      }
    };

    const contentElement = contentRef.current;
    contentElement.addEventListener('click', handleCaseClick);

    return () => {
      contentElement.removeEventListener('click', handleCaseClick);
    };
  }, [formattedContent]);

  if (!enableCitationLinks) {
    return (
      <div 
        ref={contentRef}
        className="whitespace-pre-wrap break-words overflow-wrap-break-word text-sm"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  }
  const citations = extractKeyCitations(formattedContent);
  
  if (citations.length === 0) {
    return (
      <div 
        ref={contentRef}
        className="whitespace-pre-wrap break-words overflow-wrap-break-word text-sm"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  }

  // Build content with citation links
  const contentParts: React.ReactNode[] = [];
  let lastIndex = 0;

  citations.forEach((citation, index) => {
    // Add text before citation
    if (citation.startIndex > lastIndex) {
      const beforeText = formattedContent.substring(lastIndex, citation.startIndex);
      contentParts.push(
        <span 
          key={`text-${index}`}
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: beforeText }}
        />
      );
    }

    // Add citation link with AI context
    const cleanText = cleanCitationText(citation.text);
    const caseName = extractCaseName(cleanText);
    
    // Extract AI summary context (paragraph containing the citation)
    const summaryContext = extractCitationContext(content, citation.startIndex, citation.endIndex);
    
    contentParts.push(
      <QuickConsultCitationLink
        key={`citation-${index}`}
        citation={cleanText}
        caseName={caseName}
        aiSummary={summaryContext}
        citationType={citation.type}
        className="mx-0.5"
      />
    );

    lastIndex = citation.endIndex;
  });

  // Add remaining text
  if (lastIndex < formattedContent.length) {
    const remainingText = formattedContent.substring(lastIndex);
    contentParts.push(
      <span 
        key="text-final"
        className="text-sm"
        dangerouslySetInnerHTML={{ __html: remainingText }}
      />
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words overflow-wrap-break-word">
      {contentParts}
    </div>
  );
};

export default QuickConsultMessageContent;