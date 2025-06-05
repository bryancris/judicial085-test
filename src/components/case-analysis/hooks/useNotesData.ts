
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useNotesData = (clientId: string) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!clientId) return;
    
    setNotesLoading(true);
    try {
      const { data, error } = await supabase
        .from("case_analysis_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading(false);
    }
  }, [clientId]);

  return {
    notes,
    notesLoading,
    fetchNotes
  };
};
