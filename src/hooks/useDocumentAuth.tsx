
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDocumentAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const { toast } = useToast();

  // Set up effect cleanup
  useEffect(() => {
    // Component mount indicator
    isMounted.current = true;

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted.current) {
        setSession(currentSession);
        if (!currentSession) {
          setLoading(false);
        }
      }
    });

    // Check for existing session
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
          // Always set loading to false after session check completes
          setLoading(false);
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
