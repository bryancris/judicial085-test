
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Case } from "@/types/case";

export const useClientCases = (clientId?: string) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCases = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching cases for client ID:", clientId);
      
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Cases data received:", data);
      setCases(data || []);
    } catch (err: any) {
      console.error("Error fetching cases:", err);
      setError(err.message || "Failed to load cases");
      toast({
        title: "Error loading cases",
        description: err.message || "There was a problem loading the cases.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCase = async (caseData: Omit<Case, "id" | "created_at" | "updated_at"> & { status?: string }) => {
    try {
      // Ensure client_id is set
      if (!caseData.client_id) {
        if (clientId) {
          // Use the clientId from the hook if available
          caseData.client_id = clientId;
        } else {
          throw new Error("Client ID is required to create a case");
        }
      }
      
      // Make status optional with a default value
      const dataToInsert = {
        ...caseData,
        status: caseData.status || "active"
      };
      
      console.log("Creating case with data:", dataToInsert);
      
      const { data, error } = await supabase
        .from("cases")
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Case created",
        description: "The case has been successfully created.",
      });

      // Only fetch cases if we have a clientId (we might be creating a case without having loaded cases yet)
      if (clientId) {
        await fetchCases();
      }
      
      return data;
    } catch (err: any) {
      console.error("Error creating case:", err);
      toast({
        title: "Error creating case",
        description: err.message || "There was a problem creating the case.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCase = async (id: string, caseData: Partial<Case>) => {
    try {
      const { error } = await supabase
        .from("cases")
        .update(caseData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Case updated",
        description: "The case has been successfully updated.",
      });

      await fetchCases();
      return true;
    } catch (err: any) {
      console.error("Error updating case:", err);
      toast({
        title: "Error updating case",
        description: err.message || "There was a problem updating the case.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCase = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Case deleted",
        description: "The case has been successfully deleted.",
      });

      await fetchCases();
      return true;
    } catch (err: any) {
      console.error("Error deleting case:", err);
      toast({
        title: "Error deleting case",
        description: err.message || "There was a problem deleting the case.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    console.log("useClientCases effect triggered with clientId:", clientId);
    fetchCases();
  }, [clientId]);

  return {
    cases,
    loading,
    error,
    fetchCases,
    createCase,
    updateCase,
    deleteCase,
  };
};
