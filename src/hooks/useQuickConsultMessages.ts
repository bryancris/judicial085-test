import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuickConsultMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const useQuickConsultMessages = (sessionId: string | null) => {
  const [messages, setMessages] = useState<QuickConsultMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load messages for the current session
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('quick_consult_messages' as any)
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: QuickConsultMessage[] = (data || []).map((msg: any) => ({
          id: msg.id,
          session_id: msg.session_id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, toast]);

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!sessionId) return null;

    try {
      const { data, error } = await supabase
        .from('quick_consult_messages' as any)
        .insert({
          session_id: sessionId,
          role,
          content,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newMessage: QuickConsultMessage = {
        id: (data as any).id,
        session_id: (data as any).session_id,
        role: (data as any).role,
        content: (data as any).content,
        created_at: (data as any).created_at,
      };

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive",
      });
      return null;
    }
  }, [sessionId, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages,
  };
};