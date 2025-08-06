import { supabase } from "@/integrations/supabase/client";
import { SimilarCase } from "./similarCasesApiService";

export interface CourtListenerCase {
  id: string;
  courtlistener_id: string;
  case_name: string;
  court?: string;
  court_name?: string;
  citation?: string;
  date_filed?: string;
  date_decided?: string;
  absolute_url?: string;
  snippet?: string;
  full_text?: string;
  jurisdiction?: string;
  case_type?: string;
  precedential_status?: string;
  api_fetch_count: number;
}

export interface SearchCacheEntry {
  id: string;
  query_hash: string;
  original_query: string;
  search_parameters: any;
  result_case_ids: string[];
  total_results: number;
  cached_at: string;
  expires_at: string;
  hit_count: number;
}

// Generate SHA-256 hash for query caching (MD5 not supported in browser/Deno environments)
const generateQueryHash = async (query: string, parameters: any = {}): Promise<string> => {
  const normalizedQuery = query.toLowerCase().trim();
  const searchString = JSON.stringify({ query: normalizedQuery, ...parameters });
  
  const encoder = new TextEncoder();
  const data = encoder.encode(searchString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Check cache for existing search results
export const checkSearchCache = async (
  query: string, 
  parameters: any = {}
): Promise<{ cacheEntry: SearchCacheEntry | null; cases: CourtListenerCase[] }> => {
  try {
    const queryHash = await generateQueryHash(query, parameters);
    
    const { data: cacheData, error: cacheError } = await supabase
      .from("courtlistener_search_cache" as any)
      .select("*")
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (cacheError || !cacheData || cacheData.length === 0) {
      return { cacheEntry: null, cases: [] };
    }

    const cacheEntry = cacheData[0] as any;
    
    // Increment hit count
    await supabase
      .from("courtlistener_search_cache" as any)
      .update({ hit_count: cacheEntry.hit_count + 1 })
      .eq("id", cacheEntry.id);

    // Fetch the actual case data
    if (cacheEntry.result_case_ids.length === 0) {
      return { cacheEntry: cacheEntry as SearchCacheEntry, cases: [] };
    }

    const { data: cases, error: casesError } = await supabase
      .from("courtlistener_cases" as any)
      .select("*")
      .in("id", cacheEntry.result_case_ids);

    if (casesError) {
      console.error("Error fetching cached cases:", casesError);
      return { cacheEntry: cacheEntry as SearchCacheEntry, cases: [] };
    }

    return { 
      cacheEntry: cacheEntry as SearchCacheEntry, 
      cases: (cases || []) as unknown as CourtListenerCase[] 
    };
  } catch (error) {
    console.error("Error checking search cache:", error);
    return { cacheEntry: null, cases: [] };
  }
};

// Store cases in global dataset
export const storeGlobalCases = async (
  courtListenerResults: any[]
): Promise<string[]> => {
  if (!courtListenerResults || courtListenerResults.length === 0) {
    return [];
  }

  const storedCaseIds: string[] = [];

  for (const result of courtListenerResults) {
    try {
      // Check if case already exists by courtlistener_id
      const { data: existingCase } = await supabase
        .from("courtlistener_cases" as any)
        .select("id")
        .eq("courtlistener_id", result.id?.toString())
        .limit(1);

      let caseId: string;

      if (existingCase && existingCase.length > 0) {
        // Update existing case and increment fetch count
        caseId = (existingCase[0] as any).id;
        
        // Get current fetch count first
        const { data: currentCase } = await supabase
          .from("courtlistener_cases" as any)
          .select("api_fetch_count")
          .eq("id", caseId)
          .single();

        await supabase
          .from("courtlistener_cases" as any)
          .update({ 
            api_fetch_count: ((currentCase as any)?.api_fetch_count || 0) + 1,
            last_updated_at: new Date().toISOString()
          })
          .eq("id", caseId);
      } else {
        // Insert new case
        const caseData = {
          courtlistener_id: result.id?.toString() || `temp_${Date.now()}_${Math.random()}`,
          case_name: result.caseName || result.case_name || 'Unknown Case',
          court: result.court,
          court_name: result.court_name,
          citation: result.citation,
          date_filed: result.dateFiled || result.date_filed,
          date_decided: result.dateDecided || result.date_decided,
          absolute_url: result.absolute_url,
          snippet: result.snippet,
          full_text: result.text || result.full_text,
          jurisdiction: result.jurisdiction || 'Texas',
          case_type: result.case_type,
          precedential_status: result.precedential_status,
          api_fetch_count: 1
        };

        const { data: newCase, error: insertError } = await supabase
          .from("courtlistener_cases" as any)
          .insert(caseData as any)
          .select("id")
          .single();

        if (insertError) {
          console.error("Error inserting case:", insertError);
          continue;
        }

        caseId = ((newCase as any)?.id || result.id?.toString() || `temp_${Date.now()}`);

        // Generate and store embedding for the snippet
        if (result.snippet) {
          await generateAndStoreEmbedding(caseId, result.snippet, 'snippet');
        }
      }

      storedCaseIds.push(caseId);
    } catch (error) {
      console.error("Error storing case:", error);
    }
  }

  return storedCaseIds;
};

// Generate and store embeddings for case content
const generateAndStoreEmbedding = async (
  caseId: string, 
  content: string, 
  contentType: 'snippet' | 'full_text' | 'facts' | 'holding'
) => {
  try {
    // Generate embedding using OpenAI (this would typically be done in an edge function)
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: content,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return;
    }

    const embeddingData = await response.json();
    const embedding = embeddingData.data[0].embedding;

    // Store embedding
    await supabase
      .from("courtlistener_case_embeddings" as any)
      .insert({
        case_id: caseId,
        content_type: contentType,
        content,
        embedding
      } as any);
  } catch (error) {
    console.error("Error generating embedding:", error);
  }
};

// Cache search results
export const cacheSearchResults = async (
  query: string,
  parameters: any = {},
  caseIds: string[],
  totalResults: number
): Promise<string | null> => {
  try {
    const queryHash = await generateQueryHash(query, parameters);
    
    const cacheData = {
      query_hash: queryHash,
      original_query: query,
      search_parameters: parameters,
      result_case_ids: caseIds,
      total_results: totalResults,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      hit_count: 0
    };

    const { data, error } = await supabase
      .from("courtlistener_search_cache" as any)
      .insert(cacheData as any)
      .select("id")
      .single();

    if (error) {
      console.error("Error caching search results:", error);
      return null;
    }

    return (data as any).id;
  } catch (error) {
    console.error("Error caching search:", error);
    return null;
  }
};

// Convert global cases to SimilarCase format
export const convertToSimilarCases = (
  globalCases: CourtListenerCase[],
  agentReasoning?: string
): SimilarCase[] => {
  return globalCases.map(case_ => ({
    source: "courtlistener" as const,
    clientId: null,
    clientName: "Global Knowledge Base",
    similarity: 0.85, // Default similarity score
    relevantFacts: case_.snippet || "No facts available",
    outcome: "See full case for outcome details",
    court: case_.court_name || case_.court,
    citation: case_.citation,
    dateDecided: case_.date_decided,
    url: case_.absolute_url,
    agentReasoning,
    citations: case_.citation ? [case_.citation] : []
  }));
};

// Generate query embedding using OpenAI
export const generateQueryEmbedding = async (query: string): Promise<number[] | null> => {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
};

// Semantic search using embeddings
export const semanticSearchCases = async (
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<CourtListenerCase[]> => {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateQueryEmbedding(query);
    
    if (!queryEmbedding) {
      // Fall back to text search if embedding generation fails
      const { data: cases, error } = await supabase
        .from('courtlistener_cases' as any)
        .select('*')
        .or(`case_name.ilike.%${query}%,snippet.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return (cases || []) as unknown as CourtListenerCase[];
    }

    // Use semantic search with embeddings
    const { data: results, error } = await supabase.rpc(
      'search_similar_courtlistener_cases' as any,
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit
      }
    );

    if (error) {
      console.warn('Semantic search failed, falling back to text search:', error);
      // Fall back to text search
      const { data: cases, error: textError } = await supabase
        .from('courtlistener_cases' as any)
        .select('*')
        .or(`case_name.ilike.%${query}%,snippet.ilike.%${query}%`)
        .limit(limit);

      if (textError) throw textError;
      return (cases || []) as unknown as CourtListenerCase[];
    }

    return (results || []) as unknown as CourtListenerCase[];
  } catch (error) {
    console.error('Error in semantic search:', error);
    throw error;
  }
};

// Get search statistics
export const getSearchStats = async (): Promise<{
  totalCases: number;
  totalCacheEntries: number;
  cacheHitRate: number;
  avgFetchCount: number;
}> => {
  try {
    const [casesResult, cacheResult] = await Promise.all([
      supabase.from("courtlistener_cases" as any).select("api_fetch_count", { count: "exact" }),
      supabase.from("courtlistener_search_cache" as any).select("hit_count", { count: "exact" })
    ]);

    const totalCases = casesResult.count || 0;
    const totalCacheEntries = cacheResult.count || 0;
    
    // Calculate average fetch count
    const avgFetchCount = casesResult.data && casesResult.data.length > 0
      ? casesResult.data.reduce((sum, case_) => sum + ((case_ as any).api_fetch_count || 0), 0) / casesResult.data.length
      : 0;

    // Calculate cache hit rate
    const totalHits = cacheResult.data 
      ? cacheResult.data.reduce((sum, entry) => sum + ((entry as any).hit_count || 0), 0)
      : 0;
    const cacheHitRate = totalCacheEntries > 0 ? (totalHits / totalCacheEntries) * 100 : 0;

    return {
      totalCases,
      totalCacheEntries,
      cacheHitRate,
      avgFetchCount
    };
  } catch (error) {
    console.error("Error getting search stats:", error);
    return {
      totalCases: 0,
      totalCacheEntries: 0,
      cacheHitRate: 0,
      avgFetchCount: 0
    };
  }
};