import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuickConsultMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const useQuickConsultMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<QuickConsultMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quick_consult_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch messages",
          variant: "destructive",
        });
        return;
      }

      setMessages((data || []) as QuickConsultMessage[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, toast]);

  const addMessage = useCallback(async (content: string, role: "user" | "assistant") => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase
        .from("quick_consult_messages")
        .insert({
          session_id: sessionId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save message",
          variant: "destructive",
        });
        return null;
      }

      setMessages(prev => [...prev, data as QuickConsultMessage]);
      return data;
    } catch (error) {
      console.error("Error adding message:", error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
      return null;
    }
  }, [sessionId, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages: () => setMessages([]),
  };
};