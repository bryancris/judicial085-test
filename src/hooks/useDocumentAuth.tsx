
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useDocumentAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading: loading, setLoading };
};
