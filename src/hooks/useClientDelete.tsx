
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
      
      // Delete all associated data in the correct order
      // First delete all child records that reference the client
      
      // 1. Delete case discussions
      await supabase
        .from("case_discussions")
        .delete()
        .eq("client_id", clientId);
      
      // 2. Delete case analysis notes
      await supabase
        .from("case_analysis_notes")
        .delete()
        .eq("client_id", clientId);
      
      // 3. Delete legal analyses
      await supabase
        .from("legal_analyses")
        .delete()
        .eq("client_id", clientId);
      
      // 4. Delete client messages
      await supabase
        .from("client_messages")
        .delete()
        .eq("client_id", clientId);
      
      // 5. Delete discovery related data
      // First get all discovery request IDs
      const { data: discoveryRequests } = await supabase
        .from("discovery_requests")
        .select("id")
        .eq("client_id", clientId);
      
      if (discoveryRequests && discoveryRequests.length > 0) {
        const requestIds = discoveryRequests.map(req => req.id);
        
        // Delete discovery responses and related documents
        for (const requestId of requestIds) {
          // Get response IDs
          const { data: responses } = await supabase
            .from("discovery_responses")
            .select("id")
            .eq("request_id", requestId);
          
          if (responses && responses.length > 0) {
            const responseIds = responses.map(res => res.id);
            
            // Delete discovery documents
            for (const responseId of responseIds) {
              await supabase
                .from("discovery_documents")
                .delete()
                .eq("response_id", responseId);
            }
            
            // Delete responses
            await supabase
              .from("discovery_responses")
              .delete()
              .eq("request_id", requestId);
          }
        }
        
        // Delete discovery requests
        await supabase
          .from("discovery_requests")
          .delete()
          .eq("client_id", clientId);
      }
      
      // Finally delete the client
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

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
