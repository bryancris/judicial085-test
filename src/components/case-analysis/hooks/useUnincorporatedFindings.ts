
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnincorporatedFindings = (clientId: string) => {
  const [hasUnincorporatedFindings, setHasUnincorporatedFindings] = useState(false);

  const checkForUnincorporatedFindings = useCallback(async () => {
    try {
      // Get the latest legal analysis timestamp
      const { data: latestAnalysis } = await supabase
        .from("legal_analyses")
        .select("updated_at")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!latestAnalysis || latestAnalysis.length === 0) {
        setHasUnincorporatedFindings(false);
        return;
      }

      const latestAnalysisTime = new Date(latestAnalysis[0].updated_at);

      // Check for case discussion messages after the latest analysis
      const { data: recentDiscussions } = await supabase
        .from("case_discussions")
        .select("created_at")
        .eq("client_id", clientId)
        .eq("role", "assistant")
        .gt("created_at", latestAnalysisTime.toISOString())
        .limit(1);

      setHasUnincorporatedFindings(recentDiscussions && recentDiscussions.length > 0);
    } catch (error) {
      console.error("Error checking for unincorporated findings:", error);
      setHasUnincorporatedFindings(false);
    }
  }, [clientId]);

  // Set up real-time subscription for case discussions to detect new findings
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('case-discussions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_discussions',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          // New case discussion message added, check for unincorporated findings
          checkForUnincorporatedFindings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, checkForUnincorporatedFindings]);

  return {
    hasUnincorporatedFindings,
    checkForUnincorporatedFindings
  };
};
