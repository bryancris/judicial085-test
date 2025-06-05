
import { supabase } from "@/integrations/supabase/client";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesDialog";

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

    // Insert new similar cases
    const { error: insertError } = await supabase
      .from("similar_cases")
      .insert({
        client_id: clientId,
        legal_analysis_id: legalAnalysisId,
        case_data: similarCases,
        search_metadata: metadata
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

// Load similar cases from database
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

    if (!data || data.length === 0) {
      console.log("No saved similar cases found");
      return { similarCases: [] };
    }

    const record = data[0] as SimilarCasesRecord;
    console.log("✅ Loaded similar cases from database:", record.case_data.length);
    
    return { 
      similarCases: record.case_data || [],
      metadata: record.search_metadata || {}
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
