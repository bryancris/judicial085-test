
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    isMounted.current = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event, currentSession ? 'session exists' : 'no session');
      
      if (!isMounted.current) return;

      // Handle auth errors
      if (event === 'TOKEN_REFRESHED' && !currentSession) {
        console.log('Token refresh failed, clearing session');
        setSession(null);
        setIsLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Update session state
      setSession(currentSession);
      setIsLoading(false);
    });

    // THEN check for existing session with error handling
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          // If it's a refresh token error, clear the session
          if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
            await supabase.auth.signOut();
          }
          if (isMounted.current) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted.current) {
          setSession(session);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        if (isMounted.current) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isLoading,
    setIsLoading,
    isMounted
  };
};
