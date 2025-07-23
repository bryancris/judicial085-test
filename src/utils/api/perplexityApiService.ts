import { supabase } from "@/integrations/supabase/client";

export interface PerplexitySearchResult {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations: string[];
  searchType: string;
  query: string;
}

export interface PerplexityError {
  error: string;
  details?: string;
}

/**
 * Search for legal research using Perplexity API
 */
export const searchLegalResearch = async (
  query: string,
  context?: string
): Promise<{ result?: PerplexitySearchResult; error?: string }> => {
  try {
    console.log("Searching legal research with Perplexity:", query);
    
    const { data, error } = await supabase.functions.invoke('perplexity-research', {
      body: {
        query,
        model: 'sonar-pro',
        searchType: 'legal-research',
        context
      }
    });

    if (error) {
      console.error("Error calling Perplexity research function:", error);
      return { error: error.message || "Failed to search legal research" };
    }

    return { result: data };
  } catch (err: any) {
    console.error("Exception in searchLegalResearch:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
};

/**
 * Search for similar cases using Perplexity Deep Research
 */
export const searchSimilarCasesWithPerplexity = async (
  query: string,
  context?: string
): Promise<{ result?: PerplexitySearchResult; error?: string }> => {
  try {
    console.log("Searching similar cases with Perplexity Deep Research:", query);
    
    const { data, error } = await supabase.functions.invoke('perplexity-research', {
      body: {
        query,
        model: 'sonar-deep-research',
        searchType: 'similar-cases',
        context
      }
    });

    if (error) {
      console.error("Error calling Perplexity research function:", error);
      return { error: error.message || "Failed to search similar cases" };
    }

    return { result: data };
  } catch (err: any) {
    console.error("Exception in searchSimilarCasesWithPerplexity:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
};

/**
 * General Perplexity search with reasoning
 */
export const searchWithPerplexityReasoning = async (
  query: string,
  context?: string
): Promise<{ result?: PerplexitySearchResult; error?: string }> => {
  try {
    console.log("Searching with Perplexity reasoning:", query);
    
    const { data, error } = await supabase.functions.invoke('perplexity-research', {
      body: {
        query,
        model: 'sonar-reasoning',
        searchType: 'general',
        context
      }
    });

    if (error) {
      console.error("Error calling Perplexity research function:", error);
      return { error: error.message || "Failed to perform reasoning search" };
    }

    return { result: data };
  } catch (err: any) {
    console.error("Exception in searchWithPerplexityReasoning:", err);
    return { error: err.message || "An unexpected error occurred" };
  }
};

/**
 * Save Perplexity research results to database
 */
export const savePerplexityResearch = async (
  clientId: string,
  legalAnalysisId: string,
  result: PerplexitySearchResult,
  searchType: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Saving Perplexity research to database:", { clientId, legalAnalysisId, searchType });
    
    const { error } = await supabase
      .from("perplexity_research")
      .insert({
        client_id: clientId,
        legal_analysis_id: legalAnalysisId,
        search_type: searchType,
        query: result.query,
        content: result.content,
        model: result.model,
        usage_data: result.usage,
        citations: result.citations,
        metadata: {
          searchType: result.searchType,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error("Error saving Perplexity research:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Successfully saved Perplexity research to database");
    return { success: true };
  } catch (err: any) {
    console.error("Exception saving Perplexity research:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Load Perplexity research results from database
 */
export const loadPerplexityResearch = async (
  clientId: string,
  legalAnalysisId: string,
  searchType?: string
): Promise<{ 
  results: Array<{
    id: string;
    search_type: string;
    query: string;
    content: string;
    model: string;
    citations: string[];
    created_at: string;
  }>; 
  error?: string 
}> => {
  try {
    console.log("Loading Perplexity research from database:", { clientId, legalAnalysisId, searchType });
    
    let query = supabase
      .from("perplexity_research")
      .select("*")
      .eq("client_id", clientId)
      .eq("legal_analysis_id", legalAnalysisId);

    if (searchType) {
      query = query.eq("search_type", searchType);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading Perplexity research:", error);
      return { results: [], error: error.message };
    }

    return { results: data || [] };
  } catch (err: any) {
    console.error("Exception loading Perplexity research:", err);
    return { results: [], error: err.message };
  }
};