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
  console.log('Original text for case formatting:', text);
  
  // Pattern to match numbered cases with checkmark verification
  const patterns = [
    // Pattern 1: Numbered cases with checkmark (main pattern)
    /(\d+\.\s*)([A-Z][a-zA-Z\s&.,'-]+(?:\s+v\.?\s+[A-Z][a-zA-Z\s&.,'-]+)?)\s*(✓)([^.\n\d]*?)(?=\s*\n\s*\d+\.|\s*$)/g,
    // Pattern 2: Any case name followed by checkmark (fallback)
    /([A-Z][a-zA-Z\s&.,'-]+(?:\s+v\.?\s+[A-Z][a-zA-Z\s&.,'-]+)?)\s*(✓)/g
  ];

  let formattedText = text;
  
  patterns.forEach((pattern, patternIndex) => {
    console.log(`Applying pattern ${patternIndex + 1}:`, pattern);
    
    formattedText = formattedText.replace(pattern, (match, ...groups) => {
      console.log('Pattern match found:', match, 'Groups:', groups);
      
      let number = '';
      let caseName = '';
      let description = '';
      let isVerified = false;
      
      if (patternIndex === 0) {
        // Pattern 1: numbered cases
        number = groups[0] || '';
        caseName = groups[1];
        isVerified = groups[2] === '✓';
        description = groups[3] ? groups[3].trim() : '';
      } else {
        // Pattern 2: cases without numbers
        caseName = groups[0];
        isVerified = groups[1] === '✓';
      }
      
      // Clean up case name and description
      caseName = caseName.trim().replace(/[,;:]+$/, '');
      if (description) {
        // Split description on common delimiters
        const parts = description.split(/[:\-–]/);
        description = parts.length > 1 ? parts.slice(1).join(':').trim() : description.trim();
      }
      
      console.log('Processed case:', { caseName, isVerified, number, description });
      
      // Create the formatted output
      if (isVerified) {
        const caseButton = `<span class="citation-case-link cursor-pointer text-blue-600 hover:text-blue-800 hover:underline font-semibold inline-flex items-center gap-1" data-case-name="${caseName.replace(/"/g, '&quot;')}" data-verified="true">
          ${caseName}
          <svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </span>`;
        
        console.log('Created verified case link for:', caseName);
        
        if (description) {
          return `${number}<span class="text-base">${caseButton}</span>: ${description}<br/>`;
        } else {
          return `${number}<span class="text-base">${caseButton}</span><br/>`;
        }
      } else {
        if (description) {
          return `${number}<span class="font-semibold text-base">${caseName}</span>: ${description}<br/>`;
        } else {
          return `${number}<span class="font-semibold text-base">${caseName}</span><br/>`;
        }
      }
    });
  });
  
  console.log('Final formatted text:', formattedText);
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
        
        if (caseName && isVerified) {
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