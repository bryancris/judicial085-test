
import { supabase } from "@/integrations/supabase/client";

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

export interface SimilarCasesRecord {
  id: string;
  client_id: string;
  legal_analysis_id: string;
  case_data: SimilarCase[];
  search_metadata: {
    fallbackUsed?: boolean;
    analysisFound?: boolean;
    searchStrategy?: string;
    caseType?: string;
  };
  created_at: string;
  updated_at: string;
}

// Save similar cases to database
export const saveSimilarCases = async (
  clientId: string,
  legalAnalysisId: string,
  similarCases: SimilarCase[],
  metadata: {
    fallbackUsed?: boolean;
    analysisFound?: boolean;
    searchStrategy?: string;
    caseType?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Saving similar cases to database:", { clientId, legalAnalysisId, count: similarCases.length });
    
    // First, delete any existing similar cases for this analysis
    const { error: deleteError } = await supabase
      .from("similar_cases")
      .delete()
      .eq("client_id", clientId)
      .eq("legal_analysis_id", legalAnalysisId);

    if (deleteError) {
      console.error("Error deleting existing similar cases:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Insert new similar cases with proper JSON conversion
    const { error: insertError } = await supabase
      .from("similar_cases")
      .insert({
        client_id: clientId,
        legal_analysis_id: legalAnalysisId,
        case_data: similarCases as any, // Cast to any to bypass strict typing
        search_metadata: metadata as any
      });

    if (insertError) {
      console.error("Error saving similar cases:", insertError);
      return { success: false, error: insertError.message };
    }

    console.log("✅ Successfully saved similar cases to database");
    return { success: true };
  } catch (err: any) {
    console.error("Exception saving similar cases:", err);
    return { success: false, error: err.message };
  }
};

// Load similar cases from database with fallback to most recent
export const loadSimilarCases = async (
  clientId: string,
  legalAnalysisId: string
): Promise<{ 
  similarCases: SimilarCase[]; 
  metadata?: {
    fallbackUsed?: boolean;
    analysisFound?: boolean;
    searchStrategy?: string;
    caseType?: string;
  };
  error?: string 
}> => {
  try {
    console.log("Loading similar cases from database:", { clientId, legalAnalysisId });
    
    // First, try to load similar cases for the specific analysis ID
    const { data, error } = await supabase
      .from("similar_cases")
      .select("*")
      .eq("client_id", clientId)
      .eq("legal_analysis_id", legalAnalysisId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error loading similar cases:", error);
      return { similarCases: [], error: error.message };
    }

    if (data && data.length > 0) {
      const record = data[0];
      const similarCases = Array.isArray(record.case_data) 
        ? (record.case_data as unknown as SimilarCase[])
        : [];
      
      const metadata = typeof record.search_metadata === 'object' && record.search_metadata !== null
        ? (record.search_metadata as any)
        : {};
      
      console.log("✅ Loaded similar cases from database for specific analysis:", similarCases.length);
      
      return { 
        similarCases,
        metadata
      };
    }

    // If no similar cases found for the specific analysis, try to load the most recent ones for this client
    console.log("No similar cases for specific analysis, trying to load most recent for client");
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("similar_cases")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fallbackError) {
      console.error("Error loading fallback similar cases:", fallbackError);
      return { similarCases: [], error: fallbackError.message };
    }

    if (!fallbackData || fallbackData.length === 0) {
      console.log("No saved similar cases found at all");
      return { similarCases: [] };
    }

    const fallbackRecord = fallbackData[0];
    const fallbackSimilarCases = Array.isArray(fallbackRecord.case_data) 
      ? (fallbackRecord.case_data as unknown as SimilarCase[])
      : [];
    
    const fallbackMetadata = typeof fallbackRecord.search_metadata === 'object' && fallbackRecord.search_metadata !== null
      ? (fallbackRecord.search_metadata as any)
      : {};
    
    console.log("✅ Loaded fallback similar cases from database:", fallbackSimilarCases.length);
    
    return { 
      similarCases: fallbackSimilarCases,
      metadata: fallbackMetadata
    };
  } catch (err: any) {
    console.error("Exception loading similar cases:", err);
    return { similarCases: [], error: err.message };
  }
};

// Check if similar cases exist for a legal analysis
export const checkSimilarCasesExist = async (
  clientId: string,
  legalAnalysisId: string
): Promise<{ exists: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("similar_cases")
      .select("id")
      .eq("client_id", clientId)
      .eq("legal_analysis_id", legalAnalysisId)
      .limit(1);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: data && data.length > 0 };
  } catch (err: any) {
    return { exists: false, error: err.message };
  }
};
