
/**
 * LEGAL CONTENT API SERVICE
 * 
 * This service handles all database operations for AI-generated legal analyses.
 * It provides persistence and retrieval for legal analysis content in the client intake system.
 * 
 * Key Operations:
 * - Save new AI analyses to the database
 * - Retrieve the most recent analysis for a client
 * - Handle error conditions and return user-friendly messages
 * 
 * Database Table: legal_analyses
 * Schema: id, client_id, content, timestamp, user_id, created_at
 * 
 * Integration:
 * - Used by useClientChatAnalysis for analysis persistence
 * - Used by useClientChatHistory for loading existing analyses
 * 
 * Note: Client Intake shows only the most recent analysis per client
 */

import { supabase } from "@/integrations/supabase/client";
import { AnalysisItem } from "@/hooks/useClientChatHistory";

/**
 * RETRIEVE EXISTING ANALYSIS FOR CONTEXT
 * 
 * Fetches the most recent legal analysis for a client to provide context
 * for new inquiries, ensuring continuity and augmentation rather than replacement.
 * 
 * Parameters:
 * @param clientId - Unique client identifier
 * 
 * Returns:
 * @returns Promise<{ analysis: any | null; error?: string }> - Existing analysis or null
 */
export const getExistingAnalysisForContext = async (
  clientId: string
): Promise<{ analysis: any | null; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("legal_analyses")
      .select("content, law_references, case_type, created_at")
      .eq("client_id", clientId)
      .is("case_id", null)
      .eq("analysis_type", "client-intake")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching existing analysis:", error);
      return { analysis: null, error: error.message };
    }

    if (data && data.length > 0) {
      return { analysis: data[0] };
    }

    return { analysis: null };
  } catch (err: any) {
    console.error("Error fetching existing analysis:", err);
    return { analysis: null, error: err.message };
  }
};

/**
 * SAVE LEGAL ANALYSIS TO DATABASE
 * 
 * Persists AI-generated legal analysis to the legal_analyses table.
 * Each analysis is associated with a specific client and user.
 * 
 * Parameters:
 * @param clientId - Unique client identifier
 * @param content - AI-generated analysis content (markdown formatted)
 * @param timestamp - Generation timestamp for UI display
 * 
 * Returns:
 * @returns Promise<{ success: boolean; error?: string }> - Operation result
 * 
 * Database Fields:
 * - client_id: Links analysis to specific client
 * - content: AI-generated analysis (markdown)
 * - timestamp: Display timestamp
 * - user_id: Current authenticated user
 * - created_at: Database timestamp (automatic)
 */
export const saveLegalAnalysis = async (
  clientId: string,
  content: string,
  timestamp: string,
  options: {
    caseId?: string;
    analysisType?: string;
    caseType?: string;
    lawReferences?: any[];
    documentsUsed?: any[];
    factSources?: any[];
    citations?: any[];
    provenance?: any;
  } = {}
): Promise<{ success: boolean; error?: string; analysisId?: string; validation?: any }> => {
  try {
    console.log("🔒 Using secure validation service for legal analysis save");
    
    // Call the validation and save edge function
    const { data, error } = await supabase.functions.invoke('validate-and-save-legal-analysis', {
      body: {
        clientId,
        content,
        timestamp,
        caseId: options.caseId,
        analysisType: options.analysisType || "client-intake",
        caseType: options.caseType,
        lawReferences: options.lawReferences || [],
        documentsUsed: options.documentsUsed || [],
        factSources: options.factSources || [],
        citations: options.citations || [],
        provenance: options.provenance || {}
      }
    });

    if (error) {
      console.error("❌ Validation service error:", error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error("❌ Analysis validation failed:", data);
      return { 
        success: false, 
        error: data?.error || "Analysis failed validation",
        validation: data?.validation 
      };
    }

    console.log("✅ Analysis validated and saved successfully");
    return { 
      success: true, 
      analysisId: data.analysis_id,
      validation: data.validation
    };

  } catch (err: any) {
    console.error("❌ Error in validated analysis save:", err);
    return { success: false, error: err.message };
  }
};

/**
 * RETRIEVE CLIENT LEGAL ANALYSES
 * 
 * Fetches the most recent legal analysis for a client.
 * Client Intake interface shows only the latest analysis to avoid clutter.
 * 
 * Parameters:
 * @param clientId - Unique client identifier
 * 
 * Returns:
 * @returns Promise<{ analyses: AnalysisItem[]; error?: string }> - Analyses or error
 * 
 * Data Filtering:
 * - Only the most recent analysis (limit 1)
 * - Ordered by created_at descending (newest first)
 * - Formatted to match AnalysisItem interface
 * 
 * Note: Returns array for consistency with interface, but contains max 1 item
 */
export const getClientLegalAnalyses = async (
  clientId: string
): Promise<{ analyses: AnalysisItem[]; error?: string }> => {
  try {
    /**
     * DATABASE QUERY
     * 
     * Fetch only the most recent analysis for the client.
     * Descending order + limit 1 ensures we get the latest analysis.
     */
    const { data, error } = await supabase
      .from("legal_analyses")
      .select("*")                                  // Get all fields
      .eq("client_id", clientId)                    // Filter by client
      .is("case_id", null)                          // Intake is client-level
      .eq("analysis_type", "client-intake")         // Only client-intake analyses
      .eq("validation_status", "validated")         // Only validated analyses
      .order("created_at", { ascending: false })    // Newest first
      .limit(1);                                    // Only latest analysis

    /**
     * ERROR HANDLING
     * 
     * Return empty array on error to prevent UI crashes.
     */
    if (error) {
      console.error("Error fetching legal analyses:", error);
      return { analyses: [], error: error.message };
    }

    /**
     * DATA TRANSFORMATION
     * 
     * Convert database format to AnalysisItem interface.
     * Maps only the fields needed by the UI components.
     */
    const formattedAnalyses = data.map(analysis => ({
      content: analysis.content,      // AI analysis content
      timestamp: analysis.timestamp   // Display timestamp
    }));

    return { analyses: formattedAnalyses };
  } catch (err: any) {
    /**
     * EXCEPTION HANDLING
     * 
     * Catch unexpected errors and return safe fallback.
     */
    console.error("Error fetching legal analyses:", err);
    return { analyses: [], error: err.message };
  }
};
