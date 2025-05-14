
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuthState = () => {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);
  const { toast } = useToast();

  // Check for existing session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted.current) {
        setSession(session);
      }
    });

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted.current) {
          setSession(data.session);
        }
      } catch (err) {
        console.error("Session check error:", err);
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
