
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export interface CaseAnalysisNote {
  id?: string;
  content: string;
  timestamp: string;
}

export const useCaseAnalysisChat = (clientId?: string) => {
  const [notes, setNotes] = useState<CaseAnalysisNote[]>([]);
  const [conversation, setConversation] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Memoized fetch functions to avoid unnecessary re-renders
  const fetchCaseAnalysisNotes = useCallback(async () => {
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
  }, [clientId, toast]);

  const fetchClientMessages = useCallback(async (clientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Get a representative sample - first few messages and most recent
        let selectedMessages = [];
        
        // If we have more than 6 messages, get a sample
        if (data.length > 6) {
          // Get first 2 messages
          selectedMessages = data.slice(0, 2);
          
          // Get middle 2 messages
          const middleIndex = Math.floor(data.length / 2);
          selectedMessages = [
            ...selectedMessages,
            data[middleIndex - 1],
            data[middleIndex]
          ];
          
          // Get last 2 messages
          selectedMessages = [
            ...selectedMessages,
            ...data.slice(-2)
          ];
        } else {
          // If 6 or fewer, use all messages
          selectedMessages = data;
        }
        
        // Format the messages
        const formattedMessages = selectedMessages.map(msg => ({
          content: msg.content,
          timestamp: msg.timestamp,
          role: msg.role as "attorney" | "client"
        }));
        
        setConversation(formattedMessages);
      } else {
        setConversation([]);
      }
    } catch (err) {
      console.error("Error fetching client messages:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use effect to fetch data when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchCaseAnalysisNotes();
      fetchClientMessages(clientId);
    }
    
    // Cleanup function
    return () => {
      setNotes([]);
      setConversation([]);
    };
  }, [clientId, fetchCaseAnalysisNotes, fetchClientMessages]);

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
    conversation,
    isLoading,
    loading,
    isSending,
    handleSendNote,
    formatTimestamp,
    refreshNotes: fetchCaseAnalysisNotes
  };
};
