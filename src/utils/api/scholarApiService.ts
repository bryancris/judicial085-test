
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "./baseApiService";

export interface ScholarlyArticle {
  title: string;
  link: string;
  snippet: string;
  publication_info: string;
  citation_info: number;
  authors: string;
  year: number | null;
  resources: any[];
}

export interface ScholarSearchResults {
  results: ScholarlyArticle[];
  searchMetadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_scholar_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
}

/**
 * Search for scholarly articles using Google Scholar API
 * @param query The search query
 * @param limit Maximum number of results to return (default: 5)
 * @param sort Sort method: "relevance" (default), "recent", or "cited"
 * @returns Promise with search results
 */
export const searchGoogleScholar = async (
  query: string,
  limit: number = 5,
  sort: "relevance" | "recent" | "cited" = "relevance"
): Promise<{ results: ScholarlyArticle[]; error?: string }> => {
  try {
    console.log(`Searching Google Scholar for "${query}"`);
    
    const { data, error } = await invokeFunction<ScholarSearchResults>("search-google-scholar", {
      query,
      limit,
      sort
    });

    if (error) {
      console.error("Error searching Google Scholar:", error);
      return { results: [], error };
    }

    return { results: data?.results || [] };
  } catch (err: any) {
    console.error("Exception searching Google Scholar:", err);
    return { results: [], error: err.message };
  }
};

/**
 * Search for scholarly articles related to a case using Google Scholar API
 * @param clientId The client ID
 * @param caseType Optional case type for more targeted results
 * @param limit Maximum number of results to return (default: 5)
 * @returns Promise with search results
 */
export const getScholarlyReferences = async (
  clientId: string,
  caseType?: string,
  limit: number = 5
): Promise<{ results: ScholarlyArticle[]; error?: string }> => {
  try {
    // First, get the legal analysis to extract search terms
    const { data: analysisData, error: analysisError } = await supabase
      .from("legal_analyses")
      .select("content, case_type")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (analysisError) {
      console.error("Error fetching legal analysis:", analysisError);
      return { results: [], error: analysisError.message };
    }
    
    if (!analysisData || analysisData.length === 0) {
      return { results: [], error: "No legal analysis found" };
    }
    
    // Extract important terms from the analysis content
    const analysis = analysisData[0];
    const actualCaseType = caseType || analysis.case_type || "general";
    
    // Generate search query from the analysis content
    const content = analysis.content || "";
    const keyTerms = extractKeyTerms(content, actualCaseType);
    
    // Create a search query combining case type and key terms
    const searchQuery = `${actualCaseType} ${keyTerms} Texas law`;
    
    // Call Google Scholar search
    return await searchGoogleScholar(searchQuery, limit);
  } catch (err: any) {
    console.error("Error getting scholarly references:", err);
    return { results: [], error: err.message };
  }
};

/**
 * Extract key terms from analysis content to use for scholarly search
 * @param content The analysis content
 * @param caseType The case type
 * @returns String of key search terms
 */
function extractKeyTerms(content: string, caseType: string): string {
  // Extract case-specific terms based on case type
  let specializedTerms = "";
  
  if (caseType === "consumer-protection") {
    specializedTerms = "deceptive trade practices DTPA consumer protection";
  } else if (caseType === "personal-injury") {
    specializedTerms = "negligence damages liability personal injury";
  } else if (caseType === "real-estate") {
    specializedTerms = "property real estate title lease contract";
  } else if (caseType.includes("contract")) {
    specializedTerms = "contract breach agreement damages consideration";
  }
  
  // Extract statute references
  const statuteMatches = content.match(/\b\d+\.\d+\b/g) || [];
  const statutes = statuteMatches.length > 0 ? statuteMatches.join(" ") : "";
  
  // Extract case names
  const caseMatches = content.match(/[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+/g) || [];
  const cases = caseMatches.length > 0 ? caseMatches.join(" ") : "";
  
  // Combine everything
  return `${specializedTerms} ${statutes} ${cases}`.trim();
}
