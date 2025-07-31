import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  createdAt: Date;
}

export const useQuickConsultSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load sessions from database on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('quick_consult_sessions')
          .select('*')
          .eq('is_archived', false)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const formattedSessions: ChatSession[] = (data || []).map(session => ({
          id: session.id,
          title: session.title,
          lastMessage: "", // Will be populated when messages are loaded
          timestamp: new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date(session.created_at),
        }));

        setSessions(formattedSessions);
        
        // Restore current session from localStorage
        const savedSessionId = localStorage.getItem('quickConsult_currentSessionId');
        if (savedSessionId && formattedSessions.some(s => s.id === savedSessionId)) {
          setCurrentSessionId(savedSessionId);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load chat sessions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [toast]);

  const createNewSession = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quick_consult_sessions')
        .insert({
          title: "New Chat",
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        lastMessage: "",
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: new Date(data.created_at),
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      localStorage.setItem('quickConsult_currentSessionId', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateSession = useCallback(async (sessionId: string, title?: string, lastMessage?: string) => {
    try {
      const updates: any = {};
      if (title) updates.title = title;
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('quick_consult_sessions')
          .update(updates)
          .eq('id', sessionId);

        if (error) throw error;
      }

      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? {
              ...session,
              title: title || session.title,
              lastMessage: lastMessage || session.lastMessage,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : session
      ));
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('quick_consult_sessions')
        .update({ is_archived: true })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        localStorage.removeItem('quickConsult_currentSessionId');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat session",
        variant: "destructive",
      });
    }
  }, [currentSessionId, toast]);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    localStorage.setItem('quickConsult_currentSessionId', sessionId);
  }, []);

  return {
    sessions,
    currentSessionId,
    createNewSession,
    updateSession,
    deleteSession,
    selectSession,
    isLoading,
  };
};