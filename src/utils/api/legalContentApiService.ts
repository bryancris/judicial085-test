
import { supabase } from "@/integrations/supabase/client";
import { AnalysisItem } from "@/hooks/useClientChatHistory";

// Save legal analysis to the database
export const saveLegalAnalysis = async (
  clientId: string,
  content: string,
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("legal_analyses").insert({
      client_id: clientId,
      content,
      timestamp,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      console.error("Error saving legal analysis:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving legal analysis:", err);
    return { success: false, error: err.message };
  }
};

// Get the most recent legal analysis for a client (Client Intake only shows the latest)
export const getClientLegalAnalyses = async (
  clientId: string
): Promise<{ analyses: AnalysisItem[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("legal_analyses")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching legal analyses:", error);
      return { analyses: [], error: error.message };
    }

    const formattedAnalyses = data.map(analysis => ({
      content: analysis.content,
      timestamp: analysis.timestamp
    }));

    return { analyses: formattedAnalyses };
  } catch (err: any) {
    console.error("Error fetching legal analyses:", err);
    return { analyses: [], error: err.message };
  }
};
