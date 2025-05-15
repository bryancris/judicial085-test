
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
      
      // Use raw SQL for contract_reviews deletion to ensure all entries are deleted
      // This avoids any potential foreign key constraint issues
      console.log("Deleting contract reviews with raw SQL query...");
      const { error: contractReviewsRawError } = await supabase.rpc('delete_client_contract_reviews', { client_id_param: clientId });
      
      if (contractReviewsRawError) {
        console.error("Error with raw SQL delete of contract reviews:", contractReviewsRawError);
        
        // Fallback to regular delete if RPC fails
        console.log("Trying standard delete for contract reviews...");
        const { error: contractReviewsError } = await supabase
          .from("contract_reviews")
          .delete()
          .eq("client_id", clientId);
        
        if (contractReviewsError) {
          console.error("Error deleting contract reviews:", contractReviewsError);
          throw new Error(`Failed to delete contract reviews: ${contractReviewsError.message}`);
        }
      }
      
      // 2. Delete case discussions
      console.log("Deleting case discussions...");
      const { error: caseDiscussionsError } = await supabase
        .from("case_discussions")
        .delete()
        .eq("client_id", clientId);
      
      if (caseDiscussionsError) {
        console.error("Error deleting case discussions:", caseDiscussionsError);
      }
      
      // 3. Delete case analysis notes
      console.log("Deleting case analysis notes...");
      const { error: caseAnalysisNotesError } = await supabase
        .from("case_analysis_notes")
        .delete()
        .eq("client_id", clientId);
      
      if (caseAnalysisNotesError) {
        console.error("Error deleting case analysis notes:", caseAnalysisNotesError);
      }
      
      // 4. Delete legal analyses
      console.log("Deleting legal analyses...");
      const { error: legalAnalysesError } = await supabase
        .from("legal_analyses")
        .delete()
        .eq("client_id", clientId);
      
      if (legalAnalysesError) {
        console.error("Error deleting legal analyses:", legalAnalysesError);
      }
      
      // 5. Delete client messages
      console.log("Deleting client messages...");
      const { error: clientMessagesError } = await supabase
        .from("client_messages")
        .delete()
        .eq("client_id", clientId);
      
      if (clientMessagesError) {
        console.error("Error deleting client messages:", clientMessagesError);
      }
      
      // 6. Delete discovery related data
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
      
      // 7. Delete all cases associated with this client
      console.log("Deleting cases...");
      const { error: casesError } = await supabase
        .from("cases")
        .delete()
        .eq("client_id", clientId);
      
      if (casesError) {
        console.error("Error deleting cases:", casesError);
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
        console.warn("Some contract reviews still exist for this client!", remainingReviews);
        // Force deletion with another approach
        console.log("Attempting forced deletion of remaining contract reviews...");
        
        try {
          const { error: forceDeleteError } = await supabase
            .from("contract_reviews")
            .delete()
            .eq("client_id", clientId);
          
          if (forceDeleteError) {
            throw forceDeleteError;
          }
        } catch (forceError) {
          console.error("Force deletion of contract reviews failed:", forceError);
          throw new Error("Unable to delete all contract reviews");
        }
      } else {
        console.log("All contract reviews successfully deleted");
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
