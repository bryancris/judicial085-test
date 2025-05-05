
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.first_name.toLowerCase().includes(term) ||
            client.last_name.toLowerCase().includes(term) ||
            client.email.toLowerCase().includes(term) ||
            client.phone.includes(term)
        )
      );
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error loading clients",
        description: error.message || "There was a problem loading your clients.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = (id: string, name: string) => {
    toast({
      title: "Viewing client",
      description: `Now viewing ${name}'s details.`,
    });
    navigate(`/clients/${id}`);
  };

  return {
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    loading,
    handleViewClient
  };
};
