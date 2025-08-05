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
    console.log('=== Perplexity Research Function Called ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Log authentication status
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    if (authHeader) {
      console.log('Auth header format:', authHeader.substring(0, 20) + '...');
    }
    
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Perplexity API key not configured',
          details: 'Please add PERPLEXITY_API_KEY to your Supabase Edge Function secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Perplexity API key found, length:', perplexityApiKey.length);

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, model = 'sonar-pro', searchType = 'general', context, limit }: PerplexityRequest = requestBody;

    if (!query) {
      console.error('Query is missing from request');
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Perplexity ${model} request for ${searchType}:`, query.substring(0, 100) + '...');

    // Enhance query based on search type
    let enhancedQuery = query;
    if (searchType === 'legal-research') {
      enhancedQuery = `Comprehensive legal research for: ${query}

Requirements:
1. If specific Texas statutes are mentioned (like Property Code 202.004), provide the FULL TEXT of those statutes
2. Find and summarize 5-10 relevant legal cases with:
   - Complete case names (Plaintiff v. Defendant)
   - Court names and jurisdictions  
   - Legal citations
   - Brief case summaries
   - Outcomes/holdings
   - Relevance to the query
3. Provide current Texas law analysis
4. Include practical legal guidance

Focus on verified, authoritative sources and comprehensive coverage.`;
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

    // Use faster model for similar-cases to prevent timeouts
    const selectedModel = searchType === 'similar-cases' ? 'sonar-pro' : 'sonar-pro';
    console.log('Making request to Perplexity API with model:', selectedModel);

    // Create timeout wrapper for the API call
    const timeoutMs = 35000; // 35 second timeout to stay within Edge Function limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Legal-Research/1.0'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: searchType === 'similar-cases' 
                ? 'You are a legal case database. Return only verified case information in the requested JSON format. Do not include analysis, reasoning, or explanations.'
                : 'You are a legal research expert. Provide comprehensive legal information including: 1) Full statute text when statutes are mentioned, 2) Multiple relevant cases with detailed summaries, 3) Clear legal analysis with actionable guidance. Always include 5-10 relevant cases with case names, courts, citations, and brief summaries.'
            },
            {
              role: 'user',
              content: enhancedQuery
            }
          ],
          max_tokens: searchType === 'similar-cases' ? 2000 : 4000, // Reduced tokens for similar-cases
          temperature: 0.1,
          top_p: 0.9,
          return_citations: true,
          return_images: false,
          search_domain_filter: ['justia.com', 'caselaw.findlaw.com', 'scholar.google.com', 'courtlistener.com', 'law.cornell.edu', 'statutes.capitol.texas.gov'],
          search_recency_filter: 'year'
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Perplexity API request timed out after', timeoutMs, 'ms');
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout',
            details: `The search took too long and was cancelled after ${timeoutMs / 1000} seconds. Try using a simpler search query.`,
            timeout: true,
            retryable: true
          }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError; // Re-throw other errors
    } finally {
      clearTimeout(timeoutId);
    }

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

    // Check content type to ensure we got JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Perplexity returned non-JSON response:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          error: 'Perplexity API returned invalid response format',
          details: 'Expected JSON but received: ' + (contentType || 'unknown')
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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