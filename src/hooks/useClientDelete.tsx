
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
      
      // STEP 1: Delete contract reviews first (critical due to foreign key constraints)
      console.log("Attempting to delete contract reviews with direct DELETE...");
      
      // First try: Directly delete contract reviews
      const { error: directDeleteError } = await supabase
        .from("contract_reviews")
        .delete()
        .eq("client_id", clientId);
        
      if (directDeleteError) {
        console.error("Error with direct contract reviews deletion:", directDeleteError);
        
        // Second try: Use the RPC function
        console.log("Trying RPC function for contract reviews deletion...");
        const { error: rpcError } = await supabase.rpc(
          'delete_client_contract_reviews',
          { client_id_param: clientId }
        );
        
        if (rpcError) {
          console.error("Error with RPC contract reviews deletion:", rpcError);
          throw new Error(`Cannot delete client: Unable to delete contract reviews. ${rpcError.message}`);
        }
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
        throw new Error(`Cannot delete client: ${remainingReviews.length} contract reviews still linked to this client.`);
      } else {
        console.log("All contract reviews successfully deleted");
      }

      // STEP 2: Now proceed with deleting other related data
      
      // Delete case discussions
      console.log("Deleting case discussions...");
      const { error: caseDiscussionsError } = await supabase
        .from("case_discussions")
        .delete()
        .eq("client_id", clientId);
      
      if (caseDiscussionsError) {
        console.error("Error deleting case discussions:", caseDiscussionsError);
      }
      
      // Delete case analysis notes
      console.log("Deleting case analysis notes...");
      const { error: caseAnalysisNotesError } = await supabase
        .from("case_analysis_notes")
        .delete()
        .eq("client_id", clientId);
      
      if (caseAnalysisNotesError) {
        console.error("Error deleting case analysis notes:", caseAnalysisNotesError);
      }
      
      // Delete legal analyses
      console.log("Deleting legal analyses...");
      const { error: legalAnalysesError } = await supabase
        .from("legal_analyses")
        .delete()
        .eq("client_id", clientId);
      
      if (legalAnalysesError) {
        console.error("Error deleting legal analyses:", legalAnalysesError);
      }
      
      // Delete client messages
      console.log("Deleting client messages...");
      const { error: clientMessagesError } = await supabase
        .from("client_messages")
        .delete()
        .eq("client_id", clientId);
      
      if (clientMessagesError) {
        console.error("Error deleting client messages:", clientMessagesError);
      }
      
      // Delete discovery related data
      console.log("Deleting discovery data...");
      try {
        // First get all discovery request IDs
        const { data: discoveryRequests, error: discoveryRequestsError } = await supabase
          .from("discovery_requests")
          .select("id")
          .eq("client_id", clientId);
        
        if (discoveryRequestsError) {
          console.error("Error fetching discovery requests:", discoveryRequestsError);
        }
        
        if (discoveryRequests && discoveryRequests.length > 0) {
          const requestIds = discoveryRequests.map(req => req.id);
          console.log("Found discovery requests:", requestIds);
          
          // Delete discovery responses and related documents
          for (const requestId of requestIds) {
            // Get response IDs
            const { data: responses, error: responsesError } = await supabase
              .from("discovery_responses")
              .select("id")
              .eq("request_id", requestId);
            
            if (responsesError) {
              console.error("Error fetching discovery responses:", responsesError);
            }
            
            if (responses && responses.length > 0) {
              const responseIds = responses.map(res => res.id);
              console.log("Found discovery responses:", responseIds);
              
              // Delete discovery documents
              for (const responseId of responseIds) {
                console.log("Deleting documents for response:", responseId);
                const { error: documentsError } = await supabase
                  .from("discovery_documents")
                  .delete()
                  .eq("response_id", responseId);
                
                if (documentsError) {
                  console.error("Error deleting discovery documents:", documentsError);
                }
              }
              
              // Delete responses
              console.log("Deleting discovery responses...");
              const { error: responsesDeleteError } = await supabase
                .from("discovery_responses")
                .delete()
                .eq("request_id", requestId);
              
              if (responsesDeleteError) {
                console.error("Error deleting discovery responses:", responsesDeleteError);
              }
            }
          }
          
          // Delete discovery requests
          console.log("Deleting discovery requests...");
          const { error: requestsDeleteError } = await supabase
            .from("discovery_requests")
            .delete()
            .eq("client_id", clientId);
          
          if (requestsDeleteError) {
            console.error("Error deleting discovery requests:", requestsDeleteError);
          }
        }
      } catch (discoveryError) {
        console.error("Error in discovery deletion process:", discoveryError);
      }
      
      // Delete all cases associated with this client
      console.log("Deleting cases...");
      const { error: casesError } = await supabase
        .from("cases")
        .delete()
        .eq("client_id", clientId);
      
      if (casesError) {
        console.error("Error deleting cases:", casesError);
      }
      
      // One last check for any remaining contract reviews before final client deletion
      const { data: finalCheckReviews } = await supabase
        .from("contract_reviews")
        .select("id")
        .eq("client_id", clientId);
        
      if (finalCheckReviews && finalCheckReviews.length > 0) {
        console.error("FATAL: Contract reviews still exist after multiple deletion attempts", finalCheckReviews);
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
