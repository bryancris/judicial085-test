
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDocumentAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const { toast } = useToast();

  // Authentication check
  useEffect(() => {
    // Set up the auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted.current) {
        setSession(session);
        if (!session) {
          setLoading(false);
        }
      }
    });

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error.message);
          if (isMounted.current) {
            toast({
              title: "Authentication error",
              description: "Could not retrieve session information. Please try again.",
              variant: "destructive",
            });
            setLoading(false);
          }
          return;
        }
        
        if (isMounted.current) {
          setSession(data.session);
          if (!data.session) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, loading, setLoading };
};
