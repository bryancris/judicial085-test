/**
 * Perplexity API service for case discussion research
 */

import { getEnvVars } from "./config.ts";

export interface Citation {
  text: string;
  type: 'case' | 'statute' | 'regulation' | 'url' | 'other';
  jurisdiction?: string;
  year?: string;
  relevance?: number;
}

export interface PerplexityResearchResult {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations: Citation[];
  rawCitations: string[];
  query: string;
  confidence: number;
  researchMetadata: {
    searchTime: number;
    primaryAuthorities: number;
    secondaryAuthorities: number;
  };
}

/**
 * Performs research using Perplexity API
 */
export const performPerplexityResearch = async (
  query: string,
  researchType: 'similar-cases' | 'legal-research' | 'general'
): Promise<PerplexityResearchResult> => {
  const { PERPLEXITY_API_KEY } = getEnvVars();
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set');
  }

  // Select model based on research type
  let model = 'llama-3.1-sonar-large-128k-online';
  if (researchType === 'similar-cases') {
    model = 'llama-3.1-sonar-huge-128k-online'; // Use most powerful model for case research
  }

  // Enhance query with legal context
  let enhancedQuery = query;
  if (researchType === 'similar-cases') {
    enhancedQuery = `Find similar court cases and legal precedents: ${query}. Include case citations, court names, and key legal holdings.`;
  } else if (researchType === 'legal-research') {
    enhancedQuery = `Legal research query: ${query}. Provide authoritative sources, statutes, regulations, and case law.`;
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a legal research assistant. Provide comprehensive, well-sourced legal information with proper citations. Always include specific case names, statute numbers, and court jurisdictions where applicable.'
        },
        {
          role: 'user',
          content: enhancedQuery
        }
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 2000,
      return_images: false,
      return_related_questions: false,
      search_domain_filter: ['law.cornell.edu', 'supreme.justia.com', 'casetext.com', 'law.justia.com'],
      search_recency_filter: 'year',
      frequency_penalty: 1,
      presence_penalty: 0
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No research results returned from Perplexity');
  }

  const content = data.choices[0].message.content;
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  
  const startTime = Date.now();
  
  // Enhanced citation extraction with better patterns
  const rawCitations = extractCitations(content);
  const structuredCitations = categorizeAndEnhanceCitations(rawCitations);
  
  const searchTime = Date.now() - startTime;
  const primaryAuthorities = structuredCitations.filter(c => c.type === 'case' || c.type === 'statute').length;
  const secondaryAuthorities = structuredCitations.filter(c => c.type === 'url' || c.type === 'other').length;
  
  // Calculate confidence based on citation quality and quantity
  const confidence = calculateResearchConfidence(structuredCitations, content.length);

  console.log(`✅ Perplexity research completed:`, {
    model,
    query,
    resultLength: content.length,
    structuredCitations: structuredCitations.length,
    primaryAuthorities,
    secondaryAuthorities,
    confidence,
    searchTime,
    usage
  });

  return {
    content,
    model,
    usage,
    citations: structuredCitations,
    rawCitations,
    query,
    confidence,
    researchMetadata: {
      searchTime,
      primaryAuthorities,
      secondaryAuthorities
    }
  };
};

/**
 * Enhanced citation extraction with multiple patterns
 */
const extractCitations = (content: string): string[] => {
  const citationPatterns = [
    // Case law citations with reporters
    /([A-Z][a-z\s&,.']+\s+v\.?\s+[A-Z][a-z\s&,.']+),?\s+(\d+\s+[A-Za-z.]+\s+\d+)\s*\(([^)]+)\s+(\d{4})\)/gi,
    // Simple case citations
    /([A-Z][a-z\s&,.']+\s+v\.?\s+[A-Z][a-z\s&,.']+)/gi,
    // U.S. Code citations
    /(\d+)\s+U\.?S\.?C\.?\s+[§§]?\s*(\d+[\w\-\.]*)/gi,
    // CFR citations
    /(\d+)\s+C\.?F\.?R\.?\s+[§§]?\s*(\d+[\w\-\.]*)/gi,
    // State statute citations
    /([A-Z][a-z\s]+)\s+(Code|Stat\.?|Rev\.?\s+Stat\.?)\s+[§§]?\s*(\d+[\w\-\.]*)/gi,
    // Federal Rules
    /(Fed\.?\s+R\.?\s+(Civ\.?\s+P\.|Evid\.?|Crim\.?\s+P\.?))\s+(\d+[\w\-\.]*)/gi,
    // URLs
    /https?:\/\/[^\s)]+/gi,
    // Generic section references
    /[§§]\s*(\d+[\w\-\.]*)/gi
  ];

  const citations: string[] = [];
  
  citationPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      citations.push(match[0].trim());
    }
  });
  
  return [...new Set(citations)]; // Remove duplicates
};

/**
 * Categorize and enhance citations with metadata
 */
const categorizeAndEnhanceCitations = (rawCitations: string[]): Citation[] => {
  return rawCitations.map(citation => {
    const lowerCitation = citation.toLowerCase();
    
    // Determine citation type
    let type: Citation['type'] = 'other';
    let jurisdiction: string | undefined;
    let year: string | undefined;
    
    if (citation.includes(' v. ') || citation.includes(' v ')) {
      type = 'case';
      // Extract year from case citation
      const yearMatch = citation.match(/\(.*(\d{4}).*\)/);
      if (yearMatch) year = yearMatch[1];
      
      // Extract jurisdiction
      const jurisdictionMatch = citation.match(/\(([^)]+)\s+\d{4}\)/);
      if (jurisdictionMatch) jurisdiction = jurisdictionMatch[1];
    } else if (lowerCitation.includes('u.s.c') || lowerCitation.includes('usc')) {
      type = 'statute';
      jurisdiction = 'Federal';
    } else if (lowerCitation.includes('c.f.r') || lowerCitation.includes('cfr')) {
      type = 'regulation';
      jurisdiction = 'Federal';
    } else if (lowerCitation.includes('code') || lowerCitation.includes('stat')) {
      type = 'statute';
      // Try to extract state from statute citation
      const stateMatch = citation.match(/^([A-Z][a-z\s]+)\s+(Code|Stat)/);
      if (stateMatch) jurisdiction = stateMatch[1];
    } else if (citation.startsWith('http')) {
      type = 'url';
    }
    
    // Calculate relevance score (simplified)
    let relevance = 0.5;
    if (type === 'case') relevance = 0.9;
    else if (type === 'statute') relevance = 0.8;
    else if (type === 'regulation') relevance = 0.7;
    else if (type === 'url') relevance = 0.3;
    
    return {
      text: citation,
      type,
      jurisdiction,
      year,
      relevance
    };
  }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0)); // Sort by relevance
};

/**
 * Calculate confidence score based on citation quality
 */
const calculateResearchConfidence = (citations: Citation[], contentLength: number): number => {
  let confidence = 0.3; // Base confidence
  
  // Quality of citations
  const primaryCount = citations.filter(c => c.type === 'case' || c.type === 'statute').length;
  const totalCount = citations.length;
  
  if (primaryCount > 0) confidence += 0.3;
  if (primaryCount >= 3) confidence += 0.2;
  if (totalCount >= 5) confidence += 0.1;
  
  // Content quality indicator
  if (contentLength > 500) confidence += 0.1;
  if (contentLength > 1000) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
};