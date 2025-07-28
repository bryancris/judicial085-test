import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface QuickConsultSession {
  id: string;
  user_id: string;
  firm_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export const useQuickConsultSessions = () => {
  const [sessions, setSessions] = useState<QuickConsultSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("quick_consult_sessions")
        .select(`
          *,
          quick_consult_messages!inner(id)
        `)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch chat sessions",
          variant: "destructive",
        });
        return;
      }

      // Filter to only include sessions that have messages
      const sessionsWithMessages = (data || []).filter(session => 
        session.quick_consult_messages && session.quick_consult_messages.length > 0
      );

      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createSession = useCallback(async (title?: string): Promise<string | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return null;

      const { data: firmData } = await supabase
        .from("firm_users")
        .select("firm_id")
        .eq("user_id", userData.user.id)
        .eq("is_active", true)
        .single();

      const { data, error } = await supabase
        .from("quick_consult_sessions")
        .insert({
          user_id: userData.user.id,
          firm_id: firmData?.firm_id,
          title: title || "New Chat",
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create new chat session",
          variant: "destructive",
        });
        return null;
      }

      await fetchSessions();
      return data.id;
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat session",
        variant: "destructive",
      });
      return null;
    }
  }, [toast, fetchSessions]);

  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("quick_consult_sessions")
        .update({ title })
        .eq("id", sessionId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update session title",
          variant: "destructive",
        });
        return;
      }

      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId ? { ...session, title } : session
        )
      );
    } catch (error) {
      console.error("Error updating session title:", error);
      toast({
        title: "Error",
        description: "Failed to update session title",
        variant: "destructive",
      });
    }
  }, [toast]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("quick_consult_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete session",
          variant: "destructive",
        });
        return;
      }

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: "Success",
        description: "Chat session deleted",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    createSession,
    updateSessionTitle,
    deleteSession,
    refetchSessions: fetchSessions,
  };
};