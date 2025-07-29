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

      // Handle 406 (Not Acceptable) - session doesn't exist
      if (error?.code === '406' || error?.code === 'PGRST116') {
        console.log("Session not found (406 error):", sessionId);
        return false;
      }

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
  ): Promise<QuickConsultMessage | null> => {
    let currentSessionId = sessionId;

    // If no session ID and this is a user message, create a new session
    if (!currentSessionId && role === "user" && onSessionInvalid) {
      console.log("No session ID, creating new session for first message");
      currentSessionId = await onSessionInvalid();
      if (!currentSessionId) {
        toast({
          title: "Error",
          description: "Failed to create new session",
          variant: "destructive",
        });
        return null;
      }
    }

    if (!currentSessionId) {
      console.error("No session ID available");
      return null;
    }

    try {
      // Before saving message, validate that session still exists
      const sessionExists = await validateSession(currentSessionId);
      if (!sessionExists) {
        console.log("Session no longer exists before saving message");
        toast({
          title: "Session Error", 
          description: "Session no longer exists. Please start a new chat.",
          variant: "destructive",
        });
        return null;
      }

      // Attempt to save the message
      const { data, error } = await supabase
        .from("quick_consult_messages")
        .insert({
          session_id: currentSessionId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to save message:", error);
        
        // Check if the error is due to session not existing (RLS violation)
        if (error.message?.includes("row-level security policy") || 
            error.message?.includes("violates") ||
            error.code === "42501") {
          
          if (onSessionInvalid) {
            console.log("RLS error detected, attempting to create new session...");
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
                console.error("Failed to save message after session recovery:", retryError);
                toast({
                  title: "Error",
                  description: "Failed to save message after session recovery",
                  variant: "destructive",
                });
                return null;
              }

              setMessages(prev => [...prev, retryData as QuickConsultMessage]);
              return retryData as QuickConsultMessage;
            }
          }
        }

        toast({
          title: "Chat Error",
          description: "Failed to save your message. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      setMessages(prev => [...prev, data as QuickConsultMessage]);
      return data as QuickConsultMessage;
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