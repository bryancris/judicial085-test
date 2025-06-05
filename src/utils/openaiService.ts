
import { invokeFunction } from "./api/baseApiService";

export interface SimilarCase {
  source: "internal" | "courtlistener";
  clientId: string | null;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
  court?: string;
  citation?: string;
  dateDecided?: string;
  url?: string | null;
  agentReasoning?: string;
}

export interface SearchSimilarCasesResult {
  similarCases: any[];
  error?: string;
  fallbackUsed?: boolean;
  analysisFound?: boolean;
  searchStrategy?: string;
  message?: string;
  caseType?: string;
}

export const searchSimilarCases = async (clientId: string): Promise<SearchSimilarCasesResult> => {
  try {
    const { data, error } = await invokeFunction("search-similar-cases", { clientId });
    
    if (error) {
      return { 
        similarCases: [], 
        error,
        fallbackUsed: false,
        analysisFound: false,
        searchStrategy: "error",
        message: "An error occurred while searching for similar cases.",
        caseType: "legal"
      };
    }
    
    // Cast the data to the expected type and ensure all required properties exist
    const resultData = data as any;
    
    return {
      similarCases: resultData?.similarCases || [],
      error: resultData?.error,
      fallbackUsed: resultData?.fallbackUsed,
      analysisFound: resultData?.analysisFound,
      searchStrategy: resultData?.searchStrategy,
      message: resultData?.message,
      caseType: resultData?.caseType
    };
  } catch (error: any) {
    console.error("Error in searchSimilarCases:", error);
    return { 
      similarCases: [], 
      error: error.message || "An unexpected error occurred",
      fallbackUsed: false,
      analysisFound: false,
      searchStrategy: "error",
      message: "An error occurred while searching for similar cases. Please try again.",
      caseType: "legal"
    };
  }
};
