import { useState, useCallback, useEffect } from "react";
import { QuickConsultMessage, sendQuickConsultMessage } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useQuickConsult = (clientId?: string, sessionId?: string, createNewSession?: () => Promise<string | null>) => {
  const [messages, setMessages] = useState<QuickConsultMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const { toast } = useToast();

  // Load messages for current session
  useEffect(() => {
    const loadMessages = async () => {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quick_consult_messages' as any)
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: QuickConsultMessage[] = ((data || []) as any).map((msg: any) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      console.log("Quick Consult: Empty message, not sending");
      return;
    }

    console.log("Quick Consult: Starting to send message", { content: content.slice(0, 50), sessionId, hasCreateFunction: !!createNewSession });

    // If no session ID and we can create one, do so
    let currentSessionId = sessionId;
    if (!currentSessionId && createNewSession) {
      console.log("Quick Consult: No session ID, creating new session");
      setIsLoading(true);
      try {
        currentSessionId = await createNewSession();
        console.log("Quick Consult: New session created", { sessionId: currentSessionId });
        if (!currentSessionId) {
          console.error("Quick Consult: Failed to create new session");
          toast({
            title: "Error",
            description: "Failed to create chat session. Please try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Quick Consult: Error creating session:", error);
        toast({
          title: "Error",
          description: "Failed to create chat session. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    if (!currentSessionId) {
      console.error("Quick Consult: No session ID available and cannot create one");
      toast({
        title: "Error",
        description: "No chat session available. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: QuickConsultMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    try {
      console.log("Quick Consult: Saving user message to database", { sessionId: currentSessionId });
      await supabase
        .from('quick_consult_messages' as any)
        .insert({
          session_id: currentSessionId,
          role: 'user',
          content: content.trim(),
        } as any);
      console.log("Quick Consult: User message saved successfully");
    } catch (error) {
      console.error('Quick Consult: Error saving user message:', error);
    }

    try {
      console.log("Quick Consult: Sending message to AI service");
      const currentMessages = [...messages, userMessage];
      const response = await sendQuickConsultMessage(currentMessages);
      console.log("Quick Consult: Received AI response", { hasResponse: !!response, hasError: !!response?.error });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Store the full response for potential citation display
      setLastResponse(response);

      const assistantMessage: QuickConsultMessage = {
        role: "assistant",
        content: response.text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      try {
        console.log("Quick Consult: Saving assistant message to database");
        await supabase
          .from('quick_consult_messages' as any)
          .insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: response.text,
          } as any);
        console.log("Quick Consult: Assistant message saved successfully");
      } catch (error) {
        console.error('Quick Consult: Error saving assistant message:', error);
      }

      // Show knowledge base usage toast (if metadata is available)
      if ((response as any).hasKnowledgeBase && (response as any).documentsFound && (response as any).documentsFound > 0) {
        toast({
          title: "Knowledge Base Used",
          description: `Referenced ${(response as any).documentsFound} document(s) from the knowledge base`,
          variant: "default",
        });
      }

      // Show verification status for CourtListener cases (if metadata is available)
      if ((response as any).verifiedCases && (response as any).verifiedCases > 0) {
        toast({
          title: "Cases Verified",
          description: `Verified ${(response as any).verifiedCases} case citations with CourtListener for legal accuracy`,
          variant: "default",
        });
      }

      if ((response as any).courtListenerCitations && (response as any).courtListenerCitations > 0) {
        toast({
          title: "CourtListener Citations Added",
          description: `Added ${(response as any).courtListenerCitations} verified citations with direct links`,
          variant: "default",
        });
      } else if ((response as any).verifiedCases === 0) {
        toast({
          title: "⚠️ Citation Verification Needed",
          description: "CourtListener API requires setup for case verification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast, clientId, sessionId, createNewSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
  };
};