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

  const validateSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("quick_consult_sessions")
        .select("id")
        .eq("id", sessionId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error("Error validating session:", error);
      return false;
    }
  }, []);

  const addMessage = useCallback(async (
    content: string, 
    role: "user" | "assistant",
    onSessionInvalid?: () => Promise<string | null>
  ) => {
    if (!sessionId) return null;

    try {
      // First attempt to save the message
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
        // Check if the error is due to session not existing (RLS violation)
        if (error.message?.includes("row-level security policy") || error.message?.includes("violates")) {
          // Validate if session exists
          const sessionExists = await validateSession(sessionId);
          
          if (!sessionExists && onSessionInvalid) {
            console.log("Session no longer exists, attempting to create new session...");
            const newSessionId = await onSessionInvalid();
            
            if (newSessionId) {
              // Retry with new session
              const { data: retryData, error: retryError } = await supabase
                .from("quick_consult_messages")
                .insert({
                  session_id: newSessionId,
                  role,
                  content,
                })
                .select()
                .single();

              if (retryError) {
                throw new Error(`Failed to save message after session recovery: ${retryError.message}`);
              }

              setMessages(prev => [...prev, retryData as QuickConsultMessage]);
              return retryData;
            }
          }
        }

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
  }, [sessionId, toast, validateSession]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    addMessage,
    validateSession,
    clearMessages: () => setMessages([]),
  };
};