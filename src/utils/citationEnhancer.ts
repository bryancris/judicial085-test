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
 * Texas statute citation patterns - Ordered by specificity (most specific first)
 */
const STATUTE_CITATION_PATTERNS = [
  // Complete legal concepts with full context (highest priority)
  /Texas\s+Lemon\s+Law\s*\([^)]*Chapter\s+573[^)]*Texas\s+Business[^)]*\)/gi,
  /Implied\s+Warranties?\s*\([^)]*Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code[^)]*\)/gi,
  /Express\s+Warranties?\s*\([^)]*Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code[^)]*\)/gi,
  /Breach\s+of\s+Warranty\s*\([^)]*Texas\s+Business[^)]*\)/gi,
  /Deceptive\s+Trade\s+Practices\s+Act\s*\([^)]*DTPA[^)]*\)/gi,
  
  // Texas codes with sections (medium priority)
  /\b(?:Tex\.|Texas)\s+(?:Bus\.|Business)\s+(?:&|and)\s+(?:Com\.|Commerce)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Occ\.|Occupations?)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  /\b(?:Tex\.|Texas)\s+(?:Civ\.|Civil)\s+(?:Prac\.|Practice)\s+(?:&|and)\s+(?:Rem\.|Remedies)\s+Code\s+(?:§|[Ss]ec(?:tion)?\.?)\s*\d+\.\d+(?:\.\d+)?(?:\([a-z]\)(?:\(\d+\))?)?/gi,
  
  // General legal references (lower priority)
  /Texas\s+Lemon\s+Law/gi,
  /Magnuson-?Moss\s+Warranty\s+Act/gi,
  /Deceptive\s+Trade\s+Practices\s+Act|DTPA(?!\s*\()/gi,
  /Texas\s+Motor\s+Vehicle\s+Commission\s+Code/gi,
  /Texas\s+Business\s+(?:&|and)\s+Commerce\s+Code/gi,
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
  
  // Remove duplicates and overlapping matches using greedy longest match
  return citations
    .sort((a, b) => {
      // Sort by start index first, then by length (longest first)
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return b.citation.length - a.citation.length;
    })
    .filter((citation, index, sortedArray) => {
      // Skip duplicates
      const isDuplicate = sortedArray.findIndex(c => c.citation === citation.citation) !== index;
      if (isDuplicate) return false;
      
      // Check for overlaps with any other citation
      const hasOverlap = sortedArray.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        
        // Check if citations overlap
        const overlap = !(citation.endIndex <= other.startIndex || citation.startIndex >= other.endIndex);
        
        if (overlap) {
          // Keep the longer citation, or if same length, keep the first one
          if (citation.citation.length !== other.citation.length) {
            return citation.citation.length < other.citation.length;
          }
          return index > otherIndex;
        }
        
        return false;
      });
      
      return !hasOverlap;
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
