/**
 * Component for rendering text with enhanced citation links
 */

import React from 'react';
import LawReferenceLink from '@/components/knowledge/LawReferenceLink';
import { StatuteTooltip } from '@/components/ui/StatuteTooltip';
import { CitationMatch, EnhancedCitation } from '@/utils/citationEnhancer';
import { isStatuteCitation } from '@/utils/statuteSummaries';

interface EnhancedTextProps {
  text: string;
  citationMatches: CitationMatch[];
  enhancedCitations: EnhancedCitation[];
  className?: string;
}

export const EnhancedText: React.FC<EnhancedTextProps> = ({
  text,
  citationMatches,
  enhancedCitations,
  className = '',
}) => {
  if (citationMatches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const getCitationUrl = (citation: string): string | null => {
    const enhanced = enhancedCitations.find(
      c => c.citation === citation || c.citation.includes(citation) || citation.includes(c.citation)
    );
    return enhanced?.url || null;
  };

  // Sort matches by start index to process them in order
  const sortedMatches = [...citationMatches].sort((a, b) => a.startIndex - b.startIndex);
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedMatches.forEach((match, index) => {
    // Add text before this citation
    if (match.startIndex > lastIndex) {
      elements.push(
        <span key={`text-${index}`}>
          {text.slice(lastIndex, match.startIndex)}
        </span>
      );
    }

    // Add the citation as a link - different handling for statutes vs cases
    if (match.type === 'statute' || isStatuteCitation(match.citation)) {
      elements.push(
        <StatuteTooltip
          key={`statute-${index}`}
          citation={match.citation}
        >
          {match.citation}
        </StatuteTooltip>
      );
    } else {
      const url = getCitationUrl(match.citation);
      elements.push(
        <LawReferenceLink
          key={`citation-${index}`}
          citation={match.citation}
          url={url}
        />
      );
    }

    lastIndex = match.endIndex;
  });

  // Add remaining text after the last citation
  if (lastIndex < text.length) {
    elements.push(
      <span key="text-final">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <span className={className}>{elements}</span>;
};