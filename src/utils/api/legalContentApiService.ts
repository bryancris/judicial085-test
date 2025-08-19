
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
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    /**
     * DATABASE INSERT OPERATION
     * 
     * Insert the AI-generated analysis with proper associations.
     * User ID ensures multi-user support and data ownership.
     */
    const { error } = await supabase.from("legal_analyses").insert({
      client_id: clientId,     // Associate with specific client
      content,                 // AI analysis content
      timestamp,               // UI display timestamp
      user_id: (await supabase.auth.getUser()).data.user?.id  // Current user
    });

    /**
     * ERROR HANDLING
     * 
     * Database errors are returned with descriptive messages.
     */
    if (error) {
      console.error("Error saving legal analysis:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    /**
     * EXCEPTION HANDLING
     * 
     * Catch unexpected errors (network issues, auth failures, etc.)
     */
    console.error("Error saving legal analysis:", err);
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
