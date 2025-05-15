
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
      
      // First attempt: Try direct deletion of contract reviews
      console.log("Attempting to delete contract reviews with direct DELETE...");
      const { error: directDeleteError } = await supabase
        .from("contract_reviews")
        .delete()
        .eq("client_id", clientId);
        
      if (directDeleteError) {
        console.error("Error with direct contract reviews deletion:", directDeleteError);
      }
      
      // Second attempt: Try RPC function if available
      try {
        console.log("Trying RPC function for contract reviews deletion...");
        await supabase.rpc('delete_client_contract_reviews', {
          client_id_param: clientId
        });
      } catch (rpcError) {
        console.error("Error with RPC contract reviews deletion:", rpcError);
      }
      
      // Third attempt: Use raw SQL query as a last resort
      try {
        console.log("Attempting direct SQL deletion as fallback...");
        await supabase.from('contract_reviews').delete().eq('client_id', clientId);
      } catch (sqlError) {
        console.error("Error with direct SQL deletion:", sqlError);
      }
      
      // Verify if contract_reviews are actually deleted
      console.log("Verifying contract reviews deletion...");
      const { data: remainingReviews, error: verifyError } = await supabase
        .from("contract_reviews")
        .select("id")
        .eq("client_id", clientId);
      
      if (verifyError) {
        console.error("Error verifying contract reviews deletion:", verifyError);
      } else if (remainingReviews && remainingReviews.length > 0) {
        console.error(`Failed to delete all contract reviews. ${remainingReviews.length} reviews remain.`, remainingReviews);
        
        // Final attempt: Try to delete each contract review individually
        console.log("Attempting to delete each contract review individually...");
        for (const review of remainingReviews) {
          try {
            await supabase.from('contract_reviews').delete().eq('id', review.id);
          } catch (individualError) {
            console.error(`Failed to delete individual review ${review.id}:`, individualError);
          }
        }
        
        // Final verification
        const { data: finalCheck, error: finalCheckError } = await supabase
          .from("contract_reviews")
          .select("id")
          .eq("client_id", clientId);
          
        if (finalCheckError) {
          console.error("Error in final verification:", finalCheckError);
        } else if (finalCheck && finalCheck.length > 0) {
          throw new Error(`Cannot delete client: ${finalCheck.length} contract reviews still linked to this client.`);
        }
      }

      // Now proceed with deleting other related data
      console.log("Deleting case discussions...");
      await supabase.from("case_discussions").delete().eq("client_id", clientId);
      
      console.log("Deleting case analysis notes...");
      await supabase.from("case_analysis_notes").delete().eq("client_id", clientId);
      
      console.log("Deleting legal analyses...");
      await supabase.from("legal_analyses").delete().eq("client_id", clientId);
      
      console.log("Deleting client messages...");
      await supabase.from("client_messages").delete().eq("client_id", clientId);
      
      // Delete discovery related data
      console.log("Deleting discovery data...");
      try {
        // First get all discovery request IDs
        const { data: discoveryRequests } = await supabase
          .from("discovery_requests")
          .select("id")
          .eq("client_id", clientId);
        
        if (discoveryRequests && discoveryRequests.length > 0) {
          const requestIds = discoveryRequests.map(req => req.id);
          
          for (const requestId of requestIds) {
            // Get response IDs
            const { data: responses } = await supabase
              .from("discovery_responses")
              .select("id")
              .eq("request_id", requestId);
            
            if (responses && responses.length > 0) {
              const responseIds = responses.map(res => res.id);
              
              // Delete discovery documents for each response
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
      } catch (discoveryError) {
        console.error("Error in discovery deletion process:", discoveryError);
      }
      
      // Delete all cases associated with this client
      console.log("Deleting cases...");
      await supabase.from("cases").delete().eq("client_id", clientId);
      
      // Final check for any remaining contract reviews
      const { data: finalCheckReviews } = await supabase
        .from("contract_reviews")
        .select("id")
        .eq("client_id", clientId);
        
      if (finalCheckReviews && finalCheckReviews.length > 0) {
        throw new Error(`Cannot delete client: ${finalCheckReviews.length} contract reviews still linked after multiple deletion attempts.`);
      }
      
      // Finally delete the client
      console.log("Deleting client record...");
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) {
        console.error("Final client deletion error:", error);
        throw error;
      }

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
