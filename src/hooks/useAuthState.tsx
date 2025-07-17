
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionManager } from "./useSessionManager";
import type { Session } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionManagerEnabled, setSessionManagerEnabled] = useState(true);
  const isMounted = useRef(true);
  const { toast } = useToast();
  const sessionManager = useSessionManager();
  
  // Only access sessionManager inside the effects, not in dependency array

  useEffect(() => {
    isMounted.current = true;

    // Set up auth state listener FIRST - NEVER use async here to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change:', event, currentSession ? 'session exists' : 'no session');
      
      if (!isMounted.current) return;

      try {
        // Handle auth errors
        if (event === 'TOKEN_REFRESHED' && !currentSession) {
          console.log('Token refresh failed, clearing session');
          if (sessionManagerEnabled && sessionManager.currentSessionId) {
            // Defer this operation to prevent blocking
            setTimeout(() => {
              sessionManager.revokeSession(sessionManager.currentSessionId);
            }, 0);
          }
          setSession(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT' || !currentSession) {
          if (sessionManagerEnabled && sessionManager.currentSessionId) {
            // Defer this operation to prevent blocking
            setTimeout(() => {
              sessionManager.revokeSession(sessionManager.currentSessionId);
            }, 0);
          }
          setSession(null);
          setIsLoading(false);
          return;
        }

        // Handle successful sign in - defer session registration
        if (event === 'SIGNED_IN' && currentSession && sessionManagerEnabled) {
          console.log('User signed in, will register session');
          setTimeout(async () => {
            try {
              await sessionManager.registerSession(currentSession);
            } catch (error) {
              console.error('Failed to register session:', error);
              // Disable session manager if it fails to prevent further issues
              setSessionManagerEnabled(false);
            }
          }, 0);
        }

        // Update session state
        setSession(currentSession);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        // Graceful fallback
        setSession(currentSession);
        setIsLoading(false);
        setSessionManagerEnabled(false);
      }
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
          
          // Register session if user is already authenticated - defer to prevent blocking
          if (session && sessionManagerEnabled) {
            setTimeout(async () => {
              try {
                await sessionManager.registerSession(session);
              } catch (error) {
                console.error('Failed to register existing session:', error);
                // Disable session manager if it fails
                setSessionManagerEnabled(false);
              }
            }, 100); // Small delay to ensure auth state is stable
          }
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        if (isMounted.current) {
          setSession(null);
          setIsLoading(false);
          setSessionManagerEnabled(false);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []); // Remove sessionManager dependency to prevent infinite loop

  return {
    session,
    isLoading,
    setIsLoading,
    isMounted,
    isSessionValid: sessionManagerEnabled ? sessionManager.isSessionValid : true
  };
};
