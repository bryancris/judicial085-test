
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useConversationData = (clientId: string) => {
  const [conversation, setConversation] = useState<any[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);

  const fetchConversation = useCallback(async () => {
    if (!clientId) return;
    
    setConversationLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setConversation(data || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setConversationLoading(false);
    }
  }, [clientId]);

  return {
    conversation,
    conversationLoading,
    fetchConversation
  };
};
