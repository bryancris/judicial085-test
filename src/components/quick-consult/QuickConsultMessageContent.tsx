import React from "react";
import { extractKeyCitations, cleanCitationText } from "@/utils/citationParser";
import QuickConsultCitationLink from "./QuickConsultCitationLink";

interface QuickConsultMessageContentProps {
  content: string;
  enableCitationLinks?: boolean;
}

const QuickConsultMessageContent: React.FC<QuickConsultMessageContentProps> = ({
  content,
  enableCitationLinks = true
}) => {
  if (!enableCitationLinks) {
    return <div className="whitespace-pre-wrap break-words overflow-wrap-break-word">{content}</div>;
  }

  const citations = extractKeyCitations(content);
  
  if (citations.length === 0) {
    return <div className="whitespace-pre-wrap break-words overflow-wrap-break-word">{content}</div>;
  }

  // Build content with citation links
  const contentParts: React.ReactNode[] = [];
  let lastIndex = 0;

  citations.forEach((citation, index) => {
    // Add text before citation
    if (citation.startIndex > lastIndex) {
      contentParts.push(
        <span key={`text-${index}`}>
          {content.substring(lastIndex, citation.startIndex)}
        </span>
      );
    }

    // Add citation link
    const cleanText = cleanCitationText(citation.text);
    contentParts.push(
      <QuickConsultCitationLink
        key={`citation-${index}`}
        citation={cleanText}
        className="mx-0.5"
      />
    );

    lastIndex = citation.endIndex;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    contentParts.push(
      <span key="text-final">
        {content.substring(lastIndex)}
      </span>
    );
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words overflow-wrap-break-word">
      {contentParts}
    </div>
  );
};

export default QuickConsultMessageContent;