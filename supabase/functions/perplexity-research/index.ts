import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityRequest {
  query: string;
  model?: 'sonar' | 'sonar-pro' | 'sonar-deep-research' | 'sonar-reasoning';
  searchType?: 'legal-research' | 'similar-cases' | 'general';
  context?: string;
  limit?: number;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, model = 'sonar-pro', searchType = 'general', context, limit }: PerplexityRequest = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Perplexity ${model} request for ${searchType}:`, query);

    // Enhance query based on search type
    let enhancedQuery = query;
    if (searchType === 'legal-research') {
      enhancedQuery = `Legal research: ${query}. Focus on current Texas law, recent cases, statutes, and legal precedents. Provide citations and sources.`;
    } else if (searchType === 'similar-cases') {
      enhancedQuery = `Find verified legal cases similar to: ${query}

Return ONLY a JSON array of cases in this exact format:
[
  {
    "caseName": "Exact case name v. Defendant",
    "court": "Specific court name",
    "citation": "Legal citation",
    "date": "Decision date",
    "relevantFacts": "Key facts that make this case similar",
    "outcome": "Actual court decision/outcome",
    "url": "Direct link if available"
  }
]

Requirements:
- Maximum 5 cases
- Only real, verified legal cases
- No analysis, reasoning, or thinking process
- No introductory text or explanations
- Must be valid JSON format`;
    }

    if (context) {
      enhancedQuery += ` Context: ${context}`;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: searchType === 'similar-cases' ? 'sonar-pro' : model,
        messages: [
          {
            role: 'system',
            content: searchType === 'similar-cases' 
              ? 'You are a legal case database. Return only verified case information in the requested JSON format. Do not include analysis, reasoning, or explanations.'
              : 'You are a legal research expert. Provide accurate, well-cited legal information with proper source attribution. Focus on current law and relevant precedents.'
          },
          {
            role: 'user',
            content: enhancedQuery
          }
        ],
        max_tokens: model === 'sonar-deep-research' ? 4000 : 2000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        return_images: false,
        search_domain_filter: ['justia.com', 'caselaw.findlaw.com', 'scholar.google.com', 'courtlistener.com', 'law.cornell.edu'],
        search_recency_filter: 'year'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Perplexity API error: ${response.status}`,
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: PerplexityResponse = await response.json();
    
    console.log('Perplexity API response received:', {
      model: data.model,
      usage: data.usage,
      choices: data.choices?.length || 0
    });

    return new Response(JSON.stringify({
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
      citations: data.citations || [],
      searchType,
      query: enhancedQuery
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in perplexity-research function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});