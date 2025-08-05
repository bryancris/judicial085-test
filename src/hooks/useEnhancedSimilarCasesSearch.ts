import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkSearchCache, storeGlobalCases, cacheSearchResults, semanticSearchCases } from "@/utils/api/globalCaseSearchService";

export interface EnhancedSearchResult {
  similarCases: any[];
  searchMetadata: {
    cacheUsed: boolean;
    freshApiCall: boolean;
    searchStrategy: string;
    responseTime: number;
    totalResults: number;
    cacheHitRate?: number;
  };
  error?: string;
}

export const useEnhancedSimilarCasesSearch = () => {
  const [isSearching, setIsSearching] = useState(false);

  const searchWithCache = async (
    query: string,
    searchParams: Record<string, any> = {}
  ): Promise<EnhancedSearchResult> => {
    const startTime = Date.now();
    setIsSearching(true);

    try {
      console.log("Enhanced search starting with cache-first approach");
      
      // Step 1: Check cache first
      const cacheResult = await checkSearchCache(query, searchParams);
      
      if (cacheResult && cacheResult.cases && cacheResult.cases.length > 0) {
        const responseTime = Date.now() - startTime;
        console.log(`Cache hit! Retrieved ${cacheResult.cases.length} cases in ${responseTime}ms`);
        
        return {
          similarCases: cacheResult.cases,
          searchMetadata: {
            cacheUsed: true,
            freshApiCall: false,
            searchStrategy: "cache-first",
            responseTime,
            totalResults: cacheResult.cases.length
          }
        };
      }

      // Step 2: No cache hit, perform fresh search
      console.log("Cache miss, performing fresh API search");
      
      // Call the existing search function
      const { data, error } = await supabase.functions.invoke("search-similar-cases", {
        body: {
          query,
          useGlobalCache: true,
          ...searchParams
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const responseTime = Date.now() - startTime;
      const results = data?.similarCases || [];

      // Step 3: Cache the results for future use
      if (results.length > 0) {
        try {
          // Store individual cases in global dataset
          await storeGlobalCases(results);
          
          // Cache the search query and results
          const caseIds = results
            .filter((caseItem: any) => caseItem.source === "courtlistener" && caseItem.courtlistenerCaseId)
            .map((caseItem: any) => caseItem.courtlistenerCaseId);
          
          if (caseIds.length > 0) {
            await cacheSearchResults(query, searchParams, caseIds, results.length);
          }
        } catch (cacheError) {
          console.error("Error caching results:", cacheError);
          // Don't fail the search due to cache errors
        }
      }

      return {
        similarCases: results,
        searchMetadata: {
          cacheUsed: false,
          freshApiCall: true,
          searchStrategy: data?.searchStrategy || "intelligent",
          responseTime,
          totalResults: results.length
        }
      };

    } catch (error: any) {
      console.error("Enhanced search error:", error);
      const responseTime = Date.now() - startTime;
      
      return {
        similarCases: [],
        searchMetadata: {
          cacheUsed: false,
          freshApiCall: false,
          searchStrategy: "error",
          responseTime,
          totalResults: 0
        },
        error: error.message || "Search failed"
      };
    } finally {
      setIsSearching(false);
    }
  };

  const searchBySimilarity = async (
    query: string,
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<EnhancedSearchResult> => {
    const startTime = Date.now();
    setIsSearching(true);

    try {
      console.log("Performing semantic similarity search");

      // Generate embedding for the query
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke("generate-embedding", {
        body: { text: query }
      });

      if (embeddingError || !embeddingData?.embedding) {
        throw new Error("Failed to generate embedding for similarity search");
      }

      // Use semantic search through our global case service
      const semanticResults = await semanticSearchCases(query, threshold, limit);
      
      const responseTime = Date.now() - startTime;
      const results = semanticResults || [];

      return {
        similarCases: Array.isArray(results) ? results.map((caseItem: any) => ({
          source: "courtlistener",
          clientName: caseItem.case_name || caseItem.clientName,
          similarity: Math.round((caseItem.similarity || 0) * 100),
          relevantFacts: caseItem.content || caseItem.relevantFacts,
          outcome: caseItem.snippet || caseItem.outcome || "Legal opinion available",
          court: caseItem.court,
          citation: caseItem.citation,
          dateDecided: caseItem.date_decided || caseItem.dateDecided,
          url: caseItem.absolute_url || caseItem.url
        })) : [],
        searchMetadata: {
          cacheUsed: false,
          freshApiCall: true,
          searchStrategy: "semantic-similarity",
          responseTime,
          totalResults: Array.isArray(results) ? results.length : 0
        }
      };

    } catch (error: any) {
      console.error("Semantic search error:", error);
      const responseTime = Date.now() - startTime;
      
      return {
        similarCases: [],
        searchMetadata: {
          cacheUsed: false,
          freshApiCall: false,
          searchStrategy: "semantic-error",
          responseTime,
          totalResults: 0
        },
        error: error.message || "Semantic search failed"
      };
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchWithCache,
    searchBySimilarity,
    isSearching
  };
};