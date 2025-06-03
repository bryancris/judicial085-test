
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";
import { useAuthState } from "@/hooks/useAuthState";

export const useClientFetch = (clientId?: string) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session, isLoading: authLoading } = useAuthState();
  const { toast } = useToast();

  const fetchClientDetail = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      setError("No client ID provided");
      return;
    }

    // Wait for auth to be ready
    if (authLoading) {
      return;
    }

    if (!session) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (fetchError) {
        // Handle specific auth errors
        if (fetchError.message.includes('JWT') || fetchError.message.includes('refresh_token')) {
          console.log('Auth error detected, signing out');
          await supabase.auth.signOut();
          setError("Session expired. Please log in again.");
          return;
        }
        throw fetchError;
      }

      if (data) {
        setClient(data);
      } else {
        setError("Client not found");
      }
    } catch (err: any) {
      console.error("Error fetching client details:", err);
      setError(err.message || "Failed to load client details");
      
      // Only show toast for non-auth errors
      if (!err.message?.includes('JWT') && !err.message?.includes('refresh_token')) {
        toast({
          title: "Error loading client",
          description: err.message || "There was a problem loading the client details.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, session, authLoading, toast]);

  useEffect(() => {
    fetchClientDetail();
  }, [fetchClientDetail]);

  return {
    client,
    loading,
    error,
    session,
    refreshClient: fetchClientDetail
  };
};
