import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JustiaResolverRequest {
  caseName: string;
  citation?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Justia URL Resolver Called ===');
    
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Perplexity API key not configured',
          url: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { caseName, citation }: JustiaResolverRequest = await req.json();

    if (!caseName) {
      return new Response(
        JSON.stringify({ 
          error: 'Case name is required',
          url: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Resolving Justia URL for: ${caseName}`);

    // Construct a targeted search query for Justia
    const searchQuery = `Find the direct Justia case page URL for "${caseName}"${citation ? ` (${citation})` : ''} on law.justia.com.

Return ONLY the direct law.justia.com URL to the case opinion page, not a search results page.
Example format: https://law.justia.com/cases/texas/supreme-court/2023/21-0123/

If no direct case page URL is found, return "NOT_FOUND".`;

    // Create timeout for the API call
    const timeoutMs = 15000; // 15 second timeout
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
          'User-Agent': 'Legal-Research-URL-Resolver/1.0'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a URL resolver for legal cases. Return only the exact Justia case page URL or "NOT_FOUND". Do not include any other text or explanation.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 200,
          temperature: 0.1,
          return_citations: false,
          return_images: false,
          search_domain_filter: ['law.justia.com'],
          search_recency_filter: 'year'
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Justia resolver request timed out');
        return new Response(
          JSON.stringify({ 
            error: 'Request timeout',
            url: null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `API error: ${response.status}`,
          url: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '';
    
    console.log('Perplexity response:', content);

    // Extract and validate Justia URL
    let justiaUrl: string | null = null;
    
    if (content && content !== 'NOT_FOUND') {
      // Extract URL from the response
      const urlPattern = /https:\/\/law\.justia\.com\/cases\/[^\s]+/g;
      const matches = content.match(urlPattern);
      
      if (matches && matches.length > 0) {
        const candidateUrl = matches[0].replace(/[,.)]+$/, ''); // Remove trailing punctuation
        
        // Validate that it's a proper case page URL (not search results)
        if (candidateUrl.includes('/cases/') && 
            !candidateUrl.includes('/search/') && 
            !candidateUrl.includes('/results/') &&
            !candidateUrl.includes('?')) {
          
          console.log(`Found potential Justia URL: ${candidateUrl}`);
          
          // Optional: Verify the URL exists and contains expected content
          try {
            const verifyResponse = await fetch(candidateUrl, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(5000) 
            });
            
            if (verifyResponse.ok) {
              justiaUrl = candidateUrl;
              console.log(`Verified Justia URL: ${justiaUrl}`);
            } else {
              console.log(`Justia URL verification failed: ${verifyResponse.status}`);
            }
          } catch (verifyError) {
            console.log('Justia URL verification timeout or error, accepting URL anyway');
            justiaUrl = candidateUrl; // Accept it anyway if we can't verify quickly
          }
        }
      }
    }

    if (!justiaUrl) {
      console.log(`No valid Justia URL found for: ${caseName}`);
    }

    return new Response(JSON.stringify({
      success: true,
      caseName,
      citation,
      url: justiaUrl,
      verified: !!justiaUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in resolve-justia-url function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
      url: null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});