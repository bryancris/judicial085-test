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
    return await invokeFunction("search-similar-cases", { clientId });
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
