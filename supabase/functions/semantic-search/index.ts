import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { 
      query, 
      searchMode = 'semantic',
      matchThreshold = 0.6,
      matchCount = 15,
      semanticWeight = 0.7
    } = await req.json();

    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate embedding using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating embedding for query: "${query}"`);

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText} - ${errorData}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

    let searchResults;

    if (searchMode === 'hybrid') {
      // Use hybrid search (semantic + text)
      const { data, error } = await supabase.rpc(
        'hybrid_search_courtlistener_cases',
        {
          query_text: query,
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          semantic_weight: semanticWeight
        }
      );

      if (error) throw error;
      searchResults = data || [];
    } else {
      // Use pure semantic search
      const { data, error } = await supabase.rpc(
        'search_similar_courtlistener_cases',
        {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount
        }
      );

      if (error) throw error;
      searchResults = data || [];
    }

    console.log(`Found ${searchResults.length} results for "${query}"`);

    return new Response(
      JSON.stringify({
        results: searchResults,
        query,
        searchMode,
        matchThreshold,
        resultCount: searchResults.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in semantic search function:', error);
    
    // Try fallback text search if semantic search fails
    try {
      const { query } = await req.json();
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: fallbackResults, error: fallbackError } = await supabase
        .from('courtlistener_cases')
        .select('*')
        .or(`case_name.ilike.%${query}%,snippet.ilike.%${query}%`)
        .limit(15);

      if (fallbackError) throw fallbackError;

      console.log(`Fallback text search found ${fallbackResults?.length || 0} results`);

      return new Response(
        JSON.stringify({
          results: fallbackResults || [],
          query,
          searchMode: 'text_fallback',
          resultCount: fallbackResults?.length || 0,
          warning: 'Semantic search failed, showing text-based results'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Both semantic and fallback searches failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});