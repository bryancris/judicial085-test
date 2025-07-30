import React from "react";
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

// Helper function to format case names with enhanced styling
const formatCaseNames = (text: string): string => {
  // Pattern to match numbered case entries: 1. Case Name v. Another Name
  const caseNamePattern = /(\d+\.\s*)([A-Z][a-zA-Z\s&.,'-]+\s+v\.?\s+[A-Z][a-zA-Z\s&.,'-]+[^.\n]*)/g;
  
  return text.replace(caseNamePattern, (match, number, caseName) => {
    return `${number}<span class="font-semibold text-base">${caseName}</span>`;
  });
};

const QuickConsultMessageContent: React.FC<QuickConsultMessageContentProps> = ({
  content,
  enableCitationLinks = true
}) => {
  if (!enableCitationLinks) {
    return <div className="whitespace-pre-wrap break-words overflow-wrap-break-word text-sm">{content}</div>;
  }

  // First format case names, then process citations
  const formattedContent = formatCaseNames(content);
  const citations = extractKeyCitations(formattedContent);
  
  if (citations.length === 0) {
    return (
      <div 
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