import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from '@supabase/supabase-js';

export const useSessionManager = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const { toast } = useToast();

  // Generate a unique session token for this browser session
  const generateSessionToken = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }, []);

  // Register a new session in the database
  const registerSession = useCallback(async (session: Session) => {
    if (!session?.user?.id) return null;

    const sessionToken = generateSessionToken();
    const userAgent = navigator.userAgent;
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: session.user.id,
          session_token: sessionToken,
          user_agent: userAgent,
          is_active: true
        });

      if (error) {
        console.error('Error registering session:', error);
        return null;
      }

      setCurrentSessionId(sessionToken);
      setIsSessionValid(true);
      return sessionToken;
    } catch (err) {
      console.error('Unexpected error registering session:', err);
      return null;
    }
  }, [generateSessionToken]);

  // Check if current session is still valid
  const validateSession = useCallback(async (sessionToken: string) => {
    if (!sessionToken) return false;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('is_active, revoked_at')
        .eq('session_token', sessionToken)
        .single();

      if (error || !data || !data.is_active || data.revoked_at) {
        setIsSessionValid(false);
        return false;
      }

      setIsSessionValid(true);
      return true;
    } catch (err) {
      console.error('Error validating session:', err);
      setIsSessionValid(false);
      return false;
    }
  }, []);

  // Update session activity
  const updateSessionActivity = useCallback(async (sessionToken: string) => {
    if (!sessionToken) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', sessionToken);
    } catch (err) {
      console.error('Error updating session activity:', err);
    }
  }, []);

  // Revoke current session
  const revokeSession = useCallback(async (sessionToken: string) => {
    if (!sessionToken) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: 'user_logout'
        })
        .eq('session_token', sessionToken);

      setCurrentSessionId(null);
      setIsSessionValid(false);
    } catch (err) {
      console.error('Error revoking session:', err);
    }
  }, []);

  // Set up realtime listener for session revocation
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_sessions',
          filter: `session_token=eq.${currentSessionId}`
        },
        (payload) => {
          const session = payload.new as any;
          
          if (!session.is_active || session.revoked_at) {
            setIsSessionValid(false);
            toast({
              title: "Session Terminated",
              description: "Your account has been accessed from another location. You have been logged out for security.",
              variant: "destructive",
            });
            
            // Sign out the user
            setTimeout(() => {
              supabase.auth.signOut();
            }, 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId, toast]);

  // Periodic session validation
  useEffect(() => {
    if (!currentSessionId || !isSessionValid) return;

    const interval = setInterval(async () => {
      const isValid = await validateSession(currentSessionId);
      if (isValid) {
        await updateSessionActivity(currentSessionId);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentSessionId, isSessionValid, validateSession, updateSessionActivity]);

  return {
    currentSessionId,
    isSessionValid,
    registerSession,
    validateSession,
    updateSessionActivity,
    revokeSession,
  };
};