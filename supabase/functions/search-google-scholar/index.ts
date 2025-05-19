
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const serpApiKey = Deno.env.get('SERPAPI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5, sort = "relevance" } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!serpApiKey) {
      console.error('SerpAPI key is not configured');
      return new Response(
        JSON.stringify({ error: "SerpAPI key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Google Scholar for: "${query}", limit: ${limit}, sort: ${sort}`);

    // Build the SerpAPI URL for Google Scholar search
    const searchUrl = new URL('https://serpapi.com/search');
    searchUrl.searchParams.append('engine', 'google_scholar');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('api_key', serpApiKey);
    searchUrl.searchParams.append('num', limit.toString());
    
    if (sort === "relevance" || sort === "recent") {
      // For recent results, use the "scisbd=1" parameter
      if (sort === "recent") {
        searchUrl.searchParams.append('scisbd', '1');
      }
    } else if (sort === "cited") {
      // For most cited, we use a different approach as SerpAPI doesn't directly support this
      searchUrl.searchParams.append('as_vis', '1');
    }

    // Add Texas-specific filtering for legal research
    searchUrl.searchParams.append('as_q', 'Texas law legal');
    
    console.log(`Calling SerpAPI Google Scholar endpoint`);
    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI error (${response.status}): ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Error from SerpAPI: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Received response from SerpAPI with ${data?.organic_results?.length || 0} results`);

    // Extract and format the scholarly articles from the response
    const scholarlyArticles = data.organic_results?.map(result => ({
      title: result.title || "Untitled Article",
      link: result.link || "",
      snippet: result.snippet || "",
      publication_info: result.publication_info?.summary || "",
      citation_info: result.inline_links?.cited_by?.total || 0,
      authors: result.publication_info?.authors?.map(a => a.name || "").join(", ") || "",
      year: result.publication_info?.year || null,
      resources: result.resources || []
    })) || [];

    return new Response(
      JSON.stringify({ 
        results: scholarlyArticles,
        searchMetadata: data.search_metadata || {}
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-google-scholar function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
