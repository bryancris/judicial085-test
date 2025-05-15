
import { supabase } from "@/integrations/supabase/client";

// Get case analysis notes for a client
export const getCaseAnalysisNotes = async (
  clientId: string
): Promise<{ notes: { content: string; timestamp: string }[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("case_analysis_notes")
      .select("content, timestamp")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching case analysis notes:", error);
      return { notes: [], error: error.message };
    }

    return { notes: data || [] };
  } catch (err: any) {
    console.error("Error fetching case analysis notes:", err);
    return { notes: [], error: err.message };
  }
};

// Save a case analysis note
export const saveCaseAnalysisNote = async (
  clientId: string,
  content: string,
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("case_analysis_notes").insert({
      client_id: clientId,
      content,
      timestamp,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      console.error("Error saving case analysis note:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving case analysis note:", err);
    return { success: false, error: err.message };
  }
};
