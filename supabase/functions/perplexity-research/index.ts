import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerplexityRequest {
  query: string;
  model?: 'sonar-small' | 'sonar' | 'sonar-pro' | 'sonar-deep-research' | 'sonar-reasoning';
  searchType?: 'legal-research' | 'similar-cases' | 'current-research' | 'general';
  context?: string;
  limit?: number;
  quickMode?: boolean;
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

    const { query, model = 'sonar', searchType = 'general', context, limit, quickMode = false }: PerplexityRequest = requestBody;

    if (!query) {
      console.error('Query is missing from request');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Query is required',
          details: 'The query parameter is missing from the request body'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log request details
    console.log(`Perplexity ${model} request for ${searchType}:`, query.substring(0, 100) + '...');
    console.log('Query length:', query.length);
    console.log('Context provided:', !!context);
    console.log('Quick mode:', quickMode);

    // Treat current-research as legal-research for consistency
    const normalizedSearchType = searchType === 'current-research' ? 'legal-research' : searchType;

    // Robust context-first mode for generic queries
    let enhancedQuery = query;
    if ((query.toLowerCase().includes('general') || query.length < 50) && context) {
      console.log('Using context-first mode for generic query');
      enhancedQuery = `Based on this legal context: ${context.substring(0, 3000)}
      
Find 3-5 relevant Texas legal cases with:
- Complete case names (Plaintiff v. Defendant)  
- Texas court names (Supreme Court of Texas, Texas Court of Appeals, District Courts)
- Legal citations (Tex. citation format)
- Brief case summaries focusing on the main legal issues
- Outcomes/holdings
      
Focus on Texas jurisdiction and precedential cases.`;
    } else if (normalizedSearchType === 'legal-research') {
      // Check if this is a contract/construction case based on query content
      const isContractCase = query.toLowerCase().includes('contract') || 
                           query.toLowerCase().includes('construction') ||
                           query.toLowerCase().includes('warranty') ||
                           query.toLowerCase().includes('breach');
      
      if (isContractCase) {
        enhancedQuery = `Texas construction and contract law research for: ${query}

Requirements:
1. Find 3-5 relevant TEXAS legal cases with:
   - Complete case names (Plaintiff v. Defendant)
   - Texas court names (Supreme Court of Texas, Texas Court of Appeals, District Courts)
   - Legal citations (Tex. citation format)
   - Brief case summaries focusing on construction/contract issues
   - Outcomes/holdings related to warranties, breach, or construction
2. Include relevant Texas statutes (Property Code, Business & Commerce Code sections only)
3. Focus on Texas construction law, warranty law, and contract law
4. Provide concise practical legal guidance

Focus on Texas jurisdiction only and verified, authoritative sources.`;
      } else {
        enhancedQuery = `Legal research for: ${query}

Requirements:
1. If specific Texas statutes are mentioned, provide relevant statute sections (not full text)
2. Find and summarize 3-5 relevant legal cases with:
   - Complete case names (Plaintiff v. Defendant)
   - Court names and jurisdictions  
   - Legal citations
   - Brief case summaries
   - Outcomes/holdings
3. Provide concise Texas law analysis
4. Include practical legal guidance

Focus on verified, authoritative sources.`;
      }
    } else if (searchType === 'similar-cases') {
      enhancedQuery = `Find 3-5 verified legal cases from TEXAS COURTS ONLY similar to: ${query}

Return ONLY a JSON array of cases in this exact format:
[
  {
    "caseName": "Exact case name v. Defendant",
    "court": "Specific Texas court name",
    "citation": "Legal citation",
    "date": "Decision date",
    "relevantFacts": "Key facts that make this case similar",
    "outcome": "Actual court decision/outcome",
    "url": "Direct link if available"
  }
]

Requirements:
- Return exactly 3-5 cases from Texas jurisdiction only
- Only Texas Supreme Court, Texas Court of Appeals, or Texas District Courts
- Only real, verified legal cases from Texas
- No analysis, reasoning, or thinking process
- No introductory text or explanations
- Must be valid JSON format
- Do NOT include cases from other states`;
    }

    if (context) {
      enhancedQuery += ` Context: ${context}`;
    }

    // Map to native Perplexity model names  
    let selectedModel: string;
    if (quickMode || normalizedSearchType === 'similar-cases') {
      selectedModel = 'sonar'; // Fastest model
    } else if (model === 'sonar-small') {
      selectedModel = 'sonar';
    } else if (model === 'sonar' || model === 'sonar-pro') {
      selectedModel = 'sonar-pro';
    } else if (model === 'sonar-deep-research') {
      selectedModel = 'sonar-deep-research';
    } else if (model === 'sonar-reasoning') {
      selectedModel = 'sonar-reasoning';
    } else {
      selectedModel = 'sonar'; // Fallback for unrecognized models
    }
    console.log('Selected model:', selectedModel, 'for search type:', normalizedSearchType);

    // Create timeout wrapper for the API call
    const timeoutMs = 25000; // 25 second timeout to stay well within Edge Function limits
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
              content: normalizedSearchType === 'similar-cases' 
                ? 'You are a legal case database. Return only verified case information in the requested JSON format. Do not include analysis, reasoning, or explanations.'
                : 'You are a legal research expert. Provide concise legal information including: 1) Relevant statute sections when mentioned, 2) 3-5 relevant cases with summaries, 3) Clear legal analysis with actionable guidance. Be concise and focused.'
            },
            {
              role: 'user',
              content: enhancedQuery
            }
          ],
          max_tokens: quickMode ? 700 : (normalizedSearchType === 'similar-cases' ? 1200 : 900),
          temperature: 0.1,
          top_p: 0.9,
          return_citations: true,
          return_images: false,
          search_domain_filter: ['casetext.com', 'law.justia.com', 'courtlistener.com', 'scholar.google.com', 'law.cornell.edu', 'txcourts.gov'],
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
            success: false,
            error: 'Request timeout',
            details: `The search took too long and was cancelled after ${timeoutMs / 1000} seconds. Try using a simpler search query.`,
            timeout: true,
            retryable: true,
            content: '',
            citations: []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          success: false,
          error: `Perplexity API error: ${response.status}`,
          details: errorText,
          content: '',
          citations: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check content type to ensure we got JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Perplexity returned non-JSON response:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Perplexity API returned invalid response format',
          details: 'Expected JSON but received: ' + (contentType || 'unknown'),
          content: '',
          citations: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: PerplexityResponse = await response.json();
    
    console.log('Perplexity API response received:', {
      model: data.model,
      usage: data.usage,
      choices: data.choices?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage,
      citations: data.citations || [],
      searchType: normalizedSearchType,
      query: enhancedQuery.substring(0, 120) + '...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in perplexity-research function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      content: '',
      citations: []
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});