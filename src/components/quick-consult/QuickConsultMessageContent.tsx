import React, { useEffect, useRef } from "react";
import { extractKeyCitations, cleanCitationText, extractCaseName } from "@/utils/citationParser";
import QuickConsultCitationLink from "./QuickConsultCitationLink";
import { Check } from "lucide-react";

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
  
  return result.join('\n');
};

// Helper function to format case names with enhanced styling and verification badges
const formatCaseNames = (text: string): string => {
  let formattedText = text;
  
  // First pattern: Handle verified cases with [Verified on CourtListener] marker
  formattedText = formattedText.replace(/(\d+\.\s+)([A-Za-z][^[\n]*?)(\s+\[Verified on CourtListener\])/g, (match, number, caseName, verifiedText) => {
    caseName = caseName.trim().replace(/[,;:]+$/, '');
    const caseButton = `<span class="citation-case-link cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-semibold" data-case-name="${caseName.replace(/"/g, '&quot;')}" data-verified="true">${caseName}</span>`;
    return `${number}${caseButton}${verifiedText}`;
  });
  
  // Second pattern: Handle unverified cases - match typical case name patterns like "Party v. Party"
  formattedText = formattedText.replace(/(\d+\.\s+)([A-Za-z][^.\n]*?(?:\s+v\.\s+[A-Za-z][^.\n]*?)?)(?=\s|$|\n)/g, (match, number, caseName) => {
    // Skip if already processed (contains citation-case-link)
    if (match.includes('citation-case-link')) {
      return match;
    }
    
    // Skip if this looks like court information or dates
    if (caseName.match(/(?:Supreme Court|Court of|Fifth Court|\d{4}|Inc\.|Corp\.|LLC)/i)) {
      return match;
    }
    
    caseName = caseName.trim().replace(/[,;:]+$/, '');
    const caseButton = `<span class="citation-case-link cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-semibold" data-case-name="${caseName.replace(/"/g, '&quot;')}" data-verified="false">${caseName}</span>`;
    return `${number}${caseButton}`;
  });
  
  return formattedText;
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
        
        if (caseName) {
          // Clean up the case name for better CourtListener search
          const cleanedCaseName = caseName
            .replace(/[""]/g, '') // Remove quotes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          // Try multiple search strategies for better results
          const searchStrategies = [
            // Strategy 1: Use exact case name with quotes for precise matching
            `"${cleanedCaseName}"`,
            // Strategy 2: Just the case name without quotes
            cleanedCaseName,
            // Strategy 3: If it's a "v." case, try just the party names
            cleanedCaseName.includes(' v. ') ? cleanedCaseName.replace(' v. ', ' ') : null
          ].filter(Boolean);
          
          // Use the first strategy - exact match with quotes
          const searchQuery = searchStrategies[0];
          const searchUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(searchQuery)}&type=o&order_by=score%20desc`;
          
          console.log('Opening CourtListener search for:', searchQuery, 'URL:', searchUrl);
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