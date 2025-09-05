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

    // Try multiple approaches to find Justia URL
    let justiaUrl: string | null = null;

    // Approach 1: Search for multiple candidate URLs
    const searchQuery = `Find all possible Justia case page URLs for "${caseName}"${citation ? ` (${citation})` : ''} on law.justia.com.

Look for URLs in these formats:
- https://law.justia.com/cases/texas/supreme-court/YEAR/CASE-NUMBER/
- https://law.justia.com/cases/texas/supreme-court/YEAR/NUMERIC-ID.html
- https://law.justia.com/cases/texas/supreme-court/YEAR/NUMERIC-ID/

Return all possible URLs you find, one per line. If none found, return "NOT_FOUND".`;

    console.log('Searching for candidate URLs...');
    
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
              content: 'You are a URL resolver for legal cases. Return all possible Justia case page URLs you find, one per line. Do not include explanatory text.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 300,
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

    // Extract candidate URLs from response
    const candidateUrls: string[] = [];
    
    if (content && content !== 'NOT_FOUND') {
      // Extract all URLs from the response
      const urlPattern = /https:\/\/law\.justia\.com\/cases\/[^\s\n]+/g;
      const matches = content.match(urlPattern);
      
      if (matches) {
        for (const match of matches) {
          const cleanUrl = match.replace(/[,.)]+$/, ''); // Remove trailing punctuation
          
          // Validate that it's a proper case page URL (not search results)
          if (cleanUrl.includes('/cases/') && 
              !cleanUrl.includes('/search/') && 
              !cleanUrl.includes('/results/') &&
              !cleanUrl.includes('?')) {
            candidateUrls.push(cleanUrl);
          }
        }
      }
    }

    console.log(`Found ${candidateUrls.length} candidate URLs:`, candidateUrls);

    // Approach 2: Test each candidate URL with content verification
    for (const candidateUrl of candidateUrls) {
      console.log(`Testing URL: ${candidateUrl}`);
      
      try {
        const verifyResponse = await fetch(candidateUrl, { 
          method: 'GET',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (verifyResponse.ok) {
          // Get the page content to verify it contains the case
          const pageContent = await verifyResponse.text();
          
          // Check if the page contains case name or citation
          const caseNameWords = caseName.toLowerCase().split(' ').filter(word => word.length > 3);
          const hasMatchingContent = caseNameWords.some(word => 
            pageContent.toLowerCase().includes(word)
          );
          
          // Also check for citation if provided
          const hasCitation = citation ? 
            pageContent.toLowerCase().includes(citation.toLowerCase()) : 
            true;
          
          if (hasMatchingContent || hasCitation) {
            console.log(`Verified URL with content match: ${candidateUrl}`);
            justiaUrl = candidateUrl;
            break; // Use the first verified URL
          } else {
            console.log(`URL exists but content doesn't match case: ${candidateUrl}`);
          }
        } else {
          console.log(`URL returned ${verifyResponse.status}: ${candidateUrl}`);
        }
      } catch (verifyError) {
        console.log(`Error verifying URL ${candidateUrl}:`, verifyError.message);
        continue;
      }
    }

    // Approach 3: Fallback URL construction patterns
    if (!justiaUrl && citation) {
      console.log('Attempting fallback URL construction...');
      
      // Extract year and potential case number from citation
      const yearMatch = citation.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : null;
      
      if (year) {
        // Try common URL patterns
        const fallbackPatterns = [
          `https://law.justia.com/cases/texas/supreme-court/${year}/`,
          `https://law.justia.com/cases/us/supreme-court/${year}/`,
        ];
        
        for (const basePattern of fallbackPatterns) {
          // This is a basic attempt - in practice, you'd need the specific case number
          console.log(`Would try pattern: ${basePattern}`);
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