/**
 * Service for enhancing text with clickable citation links using Perplexity
 */

import { supabase } from "@/integrations/supabase/client";
import { isStatuteCitation } from "@/utils/statuteSummaries";

export interface CitationMatch {
  citation: string;
  startIndex: number;
  endIndex: number;
  url?: string;
  type?: 'case' | 'statute';
}

export interface EnhancedCitation {
  citation: string;
  url: string | null;
  confidence: number;
}

/**
 * Enhanced case law citation patterns
 */
const CASE_CITATION_PATTERNS = [
  // Standard case citations: "Plaintiff v. Defendant"
  /\b([A-Z][a-zA-Z\s&,.'-]+)\s+v\.\s+([A-Z][a-zA-Z\s&,.'-]+)\b/g,
  // With court and year: "Case v. Case, 123 F.3d 456 (5th Cir. 2000)"
  /\b([A-Z][a-zA-Z\s&,.'-]+)\s+v\.\s+([A-Z][a-zA-Z\s&,.'-]+),?\s*\d+\s+[A-Za-z.]+\d*\s+\d+\s*\([^)]+\)/g,
  // With just citation: "123 S.W.2d 456 (Tex. 1985)"
  /\b\d+\s+[A-Za-z.]+\d*\s+\d+\s*\([^)]+\)/g,
];

/**
 * Texas statute citation patterns
 */
const STATUTE_CITATION_PATTERNS = [
  // Texas codes: "Tex. Occ. Code § 2301.003", "Texas Occupations Code Section 2301.003"
  /\b(?:Tex\.|Texas)\s+(?:Occ\.|Occupations?)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Bus\.|Business)\s+(?:&|and)\s+(?:Com\.|Commerce)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Civ\.|Civil)\s+(?:Prac\.|Practice)\s+(?:&|and)\s+(?:Rem\.|Remedies)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Gov't|Government)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Penal|Pen\.)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  // Short form: "§ 17.50", "Section 2301.003"
  /\b(?:§|[Ss]ec(?:tion)?\.?)\s*\d{1,4}\.\d{1,4}(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/g,
];

/**
 * Extract both case and statute citations from text
 */
export const extractCitations = (text: string): CitationMatch[] => {
  const citations: CitationMatch[] = [];
  
  // Extract case citations
  CASE_CITATION_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      if (match.index !== undefined) {
        citations.push({
          citation: match[0].trim(),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: 'case'
        });
      }
    }
  });
  
  // Extract statute citations
  STATUTE_CITATION_PATTERNS.forEach(pattern => {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      if (match.index !== undefined) {
        citations.push({
          citation: match[0].trim(),
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: 'statute'
        });
      }
    }
  });
  
  // Remove duplicates and overlapping matches
  return citations
    .filter((citation, index, array) => {
      // Remove duplicates
      const isDuplicate = array.findIndex(c => c.citation === citation.citation) !== index;
      if (isDuplicate) return false;
      
      // Remove overlapping matches (keep the longer one)
      const hasOverlap = array.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        return (
          (citation.startIndex >= other.startIndex && citation.startIndex < other.endIndex) ||
          (citation.endIndex > other.startIndex && citation.endIndex <= other.endIndex)
        );
      });
      
      if (hasOverlap) {
        const overlapping = array.filter((other, otherIndex) => {
          if (index === otherIndex) return false;
          return (
            (citation.startIndex >= other.startIndex && citation.startIndex < other.endIndex) ||
            (citation.endIndex > other.startIndex && citation.endIndex <= other.endIndex)
          );
        });
        
        // Keep the longest citation
        return overlapping.every(other => citation.citation.length >= other.citation.length);
      }
      
      return true;
    })
    .sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Use Perplexity to find URLs for case citations only
 * Statutes are handled separately with direct PDF links
 */
export const enhanceCitationsWithUrls = async (citations: string[]): Promise<EnhancedCitation[]> => {
  if (citations.length === 0) return [];
  
  // Filter to only case citations (not statutes)
  const caseCitations = citations.filter(citation => !isStatuteCitation(citation));
  
  if (caseCitations.length === 0) {
    return citations.map(citation => ({ citation, url: null, confidence: 0 }));
  }
  
  try {
    const query = `Find official legal URLs for these case citations: ${caseCitations.join(', ')}. 
    Return results as JSON with format: {\"citations\": [{\\\"citation\\\": \\\"case name\\\", \\\"url\\\": \\\"official_url\\\", \\\"confidence\\\": 0.9}]}`;
    
    const { data, error } = await supabase.functions.invoke('perplexity-research', {
      body: {
        query,
        searchType: 'legal-research',
        context: 'case_citation_lookup',
        quickMode: true,
        limit: 5
      }
    });
    
    if (error) {
      console.error('Error enhancing citations:', error);
      return citations.map(citation => ({ citation, url: null, confidence: 0 }));
    }
    
    // Try to parse structured response
    if (data?.structuredCases?.citations) {
      const enhancedCases = data.structuredCases.citations.map((item: any) => ({
        citation: item.citation || item.case_name || '',
        url: item.url || null,
        confidence: item.confidence || 0.5
      }));
      
      // Combine case citations with statute citations (no URLs needed for statutes)
      return citations.map(citation => {
        if (isStatuteCitation(citation)) {
          return { citation, url: null, confidence: 1 }; // High confidence, but no URL needed
        }
        const found = enhancedCases.find(c => c.citation === citation);
        return found || { citation, url: null, confidence: 0 };
      });
    }
    
    // Fallback: parse from content
    const enhancedCitations: EnhancedCitation[] = [];
    for (const citation of citations) {
      if (isStatuteCitation(citation)) {
        enhancedCitations.push({ citation, url: null, confidence: 1 });
        continue;
      }
      
      const urlMatch = data?.content?.match(new RegExp(`${citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\n]*https?://[^\s)]+`, 'i'));
      if (urlMatch) {
        const url = urlMatch[0].match(/https?:\/\/[^\s)]+/)?.[0];
        enhancedCitations.push({
          citation,
          url: url || null,
          confidence: url ? 0.7 : 0
        });
      } else {
        enhancedCitations.push({
          citation,
          url: null,
          confidence: 0
        });
      }
    }
    
    return enhancedCitations;
    
  } catch (error) {
    console.error('Error in citation enhancement:', error);
    return citations.map(citation => ({ citation, url: null, confidence: 0 }));
  }
};

/**
 * Process text and enhance with citation links
 */
export const enhanceTextWithCitations = async (text: string): Promise<{
  enhancedCitations: EnhancedCitation[];
  citationMatches: CitationMatch[];
}> => {
  const citationMatches = extractCitations(text);
  const citations = citationMatches.map(match => match.citation);
  const enhancedCitations = await enhanceCitationsWithUrls(citations);
  
  return {
    enhancedCitations,
    citationMatches
  };
};
