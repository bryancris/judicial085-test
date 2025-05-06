
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface CaseAnalysisNote {
  id?: string;
  content: string;
  timestamp: string;
}

export const useCaseAnalysisChat = (clientId?: string) => {
  const [notes, setNotes] = useState<CaseAnalysisNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchCaseAnalysisNotes();
    }
  }, [clientId]);

  const fetchCaseAnalysisNotes = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("case_analysis_notes")
        .select("id, content, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setNotes(data || []);
    } catch (err: any) {
      console.error("Error fetching case analysis notes:", err);
      toast({
        title: "Error",
        description: "Failed to load attorney notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendNote = async (content: string) => {
    if (!clientId || !content.trim()) return;
    
    setIsSending(true);
    try {
      const timestamp = formatTimestamp();
      const newNote: CaseAnalysisNote = {
        content,
        timestamp
      };

      const { error } = await supabase.from("case_analysis_notes").insert({
        client_id: clientId,
        content,
        timestamp,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;
      
      setNotes(prev => [...prev, newNote]);
    } catch (err: any) {
      console.error("Error saving case analysis note:", err);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    notes,
    isLoading,
    isSending,
    handleSendNote,
    formatTimestamp
  };
};
