
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
      
      // Get the contract reviews to be deleted for logging purposes
      const { data: reviewsToDelete, error: fetchError } = await supabase
        .from("contract_reviews")
        .select("id, content")
        .eq("client_id", clientId);
        
      if (fetchError) {
        console.error("Error fetching contract reviews:", fetchError);
      } else {
        console.log(`Found ${reviewsToDelete?.length || 0} contract reviews to delete:`, reviewsToDelete);
      }

      // APPROACH 1: First try to remove the client_id reference
      console.log("Attempting to unlink contract reviews...");
      try {
        const { error: nullifyError } = await supabase
          .from("contract_reviews")
          .update({ client_id: null })
          .eq("client_id", clientId);
        
        if (nullifyError) {
          console.error("Error unlinking contract reviews:", nullifyError);
        }
      } catch (e) {
        console.error("Exception during contract review unlinking:", e);
      }
      
      // APPROACH 2: Direct DELETE as a primary approach
      try {
        console.log("Attempting direct DELETE...");
        const { error: deleteError } = await supabase
          .from("contract_reviews")
          .delete()
          .eq("client_id", clientId);
          
        if (deleteError) {
          console.error("Error with direct deletion:", deleteError);
        }
      } catch (directDeleteError) {
        console.error("Error with direct deletion:", directDeleteError);
      }

      // Verify if contract_reviews are actually deleted or unlinked
      console.log("Verifying contract reviews deletion...");
      const { data: remainingReviews, error: verifyError } = await supabase
        .from("contract_reviews")
        .select("id, content")
        .eq("client_id", clientId);
      
      if (verifyError) {
        console.error("Error verifying contract reviews deletion:", verifyError);
      } else if (remainingReviews && remainingReviews.length > 0) {
        console.log(`Failed to delete all contract reviews. ${remainingReviews.length} reviews remain.`, remainingReviews);
        
        // APPROACH 3: DELETE each review individually with retry logic
        console.log("Attempting individual deletions with retry logic...");
        
        for (const review of remainingReviews) {
          let deleted = false;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!deleted && attempts < maxAttempts) {
            attempts++;
            try {
              console.log(`Deleting review ${review.id} (attempt ${attempts})...`);
              
              // First try to update to remove the client_id
              const { error: updateError } = await supabase
                .from('contract_reviews')
                .update({ client_id: null })
                .eq('id', review.id);
                
              if (updateError) {
                console.error(`Failed to update review ${review.id}:`, updateError);
              }
              
              // Then delete the review
              const { error: deleteError } = await supabase
                .from('contract_reviews')
                .delete()
                .eq('id', review.id);
              
              if (!deleteError) {
                deleted = true;
                console.log(`Successfully deleted review ${review.id}`);
              } else {
                console.error(`Failed to delete review ${review.id} (attempt ${attempts}):`, deleteError);
                
                // Wait longer for each retry
                if (attempts < maxAttempts) {
                  const delay = attempts * 500; // Increasing delay: 500ms, 1000ms, 1500ms
                  console.log(`Retrying after ${delay}ms...`);
                  await new Promise(r => setTimeout(r, delay));
                }
              }
            } catch (individualError) {
              console.error(`Error during deletion of review ${review.id} (attempt ${attempts}):`, individualError);
              
              // Wait longer for each retry
              if (attempts < maxAttempts) {
                const delay = attempts * 500;
                console.log(`Retrying after ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
              }
            }
          }
        }
        
        // APPROACH 4: Try using a specific RPC function (if available in your database)
        try {
          console.log("Using delete_client_contract_reviews RPC function as final attempt...");
          await supabase.rpc('delete_client_contract_reviews', {
            client_id_param: clientId
          });
        } catch (rpcError) {
          console.error("Error with RPC function deletion:", rpcError);
        }
        
        // Final verification
        const { data: finalCheck, error: finalCheckError } = await supabase
          .from("contract_reviews")
          .select("id")
          .eq("client_id", clientId);
          
        if (finalCheckError) {
          console.error("Error in final verification:", finalCheckError);
        } else if (finalCheck && finalCheck.length > 0) {
          console.error(`Final check shows ${finalCheck.length} contract reviews still linked to client.`);
          
          // Create a detailed error message with the remaining review IDs
          const remainingIds = finalCheck.map(r => r.id).join(", ");
          throw new Error(`Cannot delete client: ${finalCheck.length} contract reviews still linked to this client.`);
        } else {
          console.log("All contract reviews successfully deleted!");
        }
      } else {
        console.log("All contract reviews successfully deleted!");
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
      
      // One more final check for any remaining contract reviews
      const { data: lastCheckReviews } = await supabase
        .from("contract_reviews")
        .select("id")
        .eq("client_id", clientId);
        
      if (lastCheckReviews && lastCheckReviews.length > 0) {
        console.error(`Still found ${lastCheckReviews.length} contract reviews after all deletion attempts.`);
        throw new Error(`Cannot delete client: ${lastCheckReviews.length} contract reviews still linked after multiple deletion attempts.`);
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
      setIsDeleting(false); // Reset the deleting state so the user can try again
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteClient, isDeleting };
};
