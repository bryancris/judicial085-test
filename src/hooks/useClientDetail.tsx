
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";

export const useClientDetail = (clientId?: string) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const { toast } = useToast();

  // Check for session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    checkSession();
  }, []);

  const fetchClientDetail = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      setError("No client ID provided");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;

      if (data) {
        setClient(data);
      } else {
        setError("Client not found");
      }
    } catch (err: any) {
      console.error("Error fetching client details:", err);
      setError(err.message || "Failed to load client details");
      toast({
        title: "Error loading client",
        description: err.message || "There was a problem loading the client details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    fetchClientDetail();
  }, [fetchClientDetail]);

  // Function to refresh client data
  const refreshClient = useCallback(() => {
    fetchClientDetail();
  }, [fetchClientDetail]);

  return { client, loading, error, session, refreshClient };
};
