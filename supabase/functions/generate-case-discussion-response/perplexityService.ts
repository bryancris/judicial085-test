/**
 * Perplexity API service for case discussion research
 */

import { getEnvVars } from "./config.ts";

export interface PerplexityResearchResult {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations: string[];
  query: string;
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
  
  // Extract citations from the content (look for URLs and case citations)
  const citationRegex = /https?:\/\/[^\s]+|[\w\s]+\s+v\.?\s+[\w\s]+,?\s+\d+/gi;
  const citations = content.match(citationRegex) || [];

  console.log(`✅ Perplexity research completed:`, {
    model,
    query,
    resultLength: content.length,
    citations: citations.length,
    usage
  });

  return {
    content,
    model,
    usage,
    citations,
    query
  };
};