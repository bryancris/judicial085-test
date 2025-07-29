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
    onSessionInvalid?: () => Promise<string | null>,
    explicitSessionId?: string // CRITICAL: Pass the active session ID directly to avoid stale state issues
  ): Promise<QuickConsultMessage | null> => {
    // CRITICAL SESSION MANAGEMENT:
    // For user messages: Use hook's sessionId and create new session if needed
    // For AI messages: MUST use explicitSessionId to avoid React state timing issues
    // The hook's sessionId may be stale when saving AI responses immediately after session creation
    let currentSessionId = explicitSessionId || sessionId;

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
      console.error("No session ID available", { role, explicitSessionId, hookSessionId: sessionId });
      return null;
    }

    console.log(`Saving ${role} message to session:`, currentSessionId);

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
        toast({
          title: "Error",
          description: "Failed to save message. Please start a new chat.",
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