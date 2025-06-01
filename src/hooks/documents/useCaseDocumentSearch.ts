
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useCaseDocumentSearch = (
  clientId: string | undefined,
  caseId: string | undefined
) => {
  const searchDocumentsBySimilarity = useCallback(async (
    query: string,
    match_threshold: number = 0.7,
    match_count: number = 5
  ) => {
    if (!clientId || !caseId || !query.trim()) {
      return { results: [], error: null };
    }

    try {
      // Get embedding for the query from OpenAI
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
      }
      
      const embeddingData = await response.json();
      const queryEmbedding = embeddingData.data[0].embedding;
      
      // Use the database function to search by similarity for this specific case
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_case_document_chunks_by_similarity',
        {
          query_embedding: queryEmbedding,
          case_id_param: caseId,
          match_threshold,
          match_count
        }
      );
      
      if (searchError) {
        throw new Error(`Search error: ${searchError.message}`);
      }
      
      return { results: searchResults || [], error: null };
    } catch (error: any) {
      console.error("Error searching case documents by similarity:", error);
      return { results: [], error: error.message };
    }
  }, [clientId, caseId]);

  return {
    searchDocumentsBySimilarity
  };
};
