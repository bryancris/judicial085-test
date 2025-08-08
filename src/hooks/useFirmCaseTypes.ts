import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";

export type FirmCaseType = Database["public"]["Tables"]["firm_case_types"]["Row"];

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function useFirmCaseTypes() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [types, setTypes] = useState<FirmCaseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load auth user and firm id
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id ?? null;
      if (!mounted) return;
      setUserId(uid);
      if (uid) {
        const { data: firmRes, error: firmErr } = await supabase.rpc("get_user_firm_id", { _user_id: uid });
        if (!mounted) return;
        if (firmErr) {
          setError(firmErr.message);
        } else {
          setFirmId(firmRes as string | null);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTypes = useCallback(async () => {
    if (!firmId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("firm_case_types")
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
      toast({ title: "Error", description: "Failed to load case types", variant: "destructive" });
    } else {
      setTypes(data || []);
    }
    setLoading(false);
  }, [firmId, toast]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const addType = useCallback(
    async (name: string) => {
      if (!userId || !firmId) {
        throw new Error("You must belong to a firm to add case types.");
      }
      const value = slugify(name);
      const { data, error } = await supabase
        .from("firm_case_types")
        .insert({ firm_id: firmId, user_id: userId, name, value })
        .select("*")
        .single();
      if (error) {
        // Handle unique violation nicely
        if (error.message?.toLowerCase().includes("duplicate") || error.code === "23505") {
          toast({ title: "Already exists", description: "That case type already exists for your firm.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Could not create case type.", variant: "destructive" });
        }
        throw error;
      }
      await fetchTypes();
      return data as FirmCaseType;
    },
    [firmId, userId, fetchTypes, toast]
  );

  const canCreate = useMemo(() => Boolean(userId && firmId), [userId, firmId]);

  return { types, loading, error, firmId, userId, addType, fetchTypes, canCreate };
}
