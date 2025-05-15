
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";

export const useClientDelete = (clientId?: string, client?: Client | null) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Function to delete a client and all related data
  const deleteClient = async () => {
    if (!clientId || !client) return;

    try {
      setIsDeleting(true);
      console.log("Starting deletion process for client:", clientId);
      
      // With ON DELETE CASCADE now properly set up, we can simply delete the client
      // and all related records will be automatically deleted by the database
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) {
        console.error("Error deleting client:", error);
        throw error;
      }

      console.log("Client and all related data successfully deleted");
      
      toast({
        title: "Client deleted",
        description: `${client.first_name} ${client.last_name} and all associated data have been deleted.`,
      });
      
      // Navigate back to the clients list
      navigate("/clients");
      
    } catch (err: any) {
      console.error("Error deleting client:", err);
      toast({
        title: "Error deleting client",
        description: err.message || "There was a problem deleting the client.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteClient, isDeleting };
};
