import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormValues } from "@/components/clients/ClientFormSchema";
import { CaseFormValues } from "@/components/clients/cases/CaseFormSchema";
import { QuickConsultMessage } from "@/utils/api/quickConsultService";
import { migrateQuickConsultMessages } from "@/utils/api/quickConsultMigrationService";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export const useCreateClientFromQuickConsult = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createClientWithCase = async (
    clientData: ClientFormValues,
    caseData: CaseFormValues,
    messages: QuickConsultMessage[]
  ): Promise<{ clientId: string; caseId: string }> => {
    setIsLoading(true);
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (!user) {
        throw new Error("You must be logged in to create a client");
      }

      // Start a transaction-like approach by creating records in order
      // Step 1: Create client
      const { data: clientResult, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address || null,
          city: clientData.city || null,
          state: clientData.state || null,
          zip_code: clientData.zip_code || null,
          case_number: clientData.case_number || null,
          case_description: clientData.case_description || null,
          referred_by: clientData.referred_by || null,
          case_notes: clientData.notes || null,
        })
        .select()
        .single();

      if (clientError) {
        throw new Error(`Failed to create client: ${clientError.message}`);
      }

      const clientId = clientResult.id;

      // Step 2: Create case
      const { data: caseResult, error: caseError } = await supabase
        .from("cases")
        .insert({
          client_id: clientId,
          case_title: caseData.case_title,
          case_type: caseData.case_type || null,
          case_description: caseData.case_description || null,
          case_notes: caseData.case_notes || null,
          case_number: caseData.case_number || null,
          status: caseData.status,
        })
        .select()
        .single();

      if (caseError) {
        // If case creation fails, we should ideally rollback the client creation
        // For now, we'll log the error and continue
        console.error("Failed to create case:", caseError);
        throw new Error(`Failed to create case: ${caseError.message}`);
      }

      const caseId = caseResult.id;

      // Step 3: Migrate Quick Consult messages to client intake
      if (messages.length > 0) {
        try {
          const migrationResult = await migrateQuickConsultMessages(messages, clientId, user.id, caseId);
          console.log(`Migrated ${migrationResult.migratedCount} messages`);
          
          // Step 4: Generate legal analysis if we have a valid conversation
          if (migrationResult.hasValidConversation) {
            console.log("Triggering legal analysis for migrated conversation...");
            
            try {
              // Convert messages to the format expected by analysis generation
              const conversationForAnalysis: ChatMessageProps[] = messages.map(msg => ({
                content: msg.content,
                role: (msg.role === "user" ? "attorney" : "client") as "attorney" | "client",
                timestamp: msg.timestamp,
              }));
              
              const analysisResult = await generateLegalAnalysis(clientId, conversationForAnalysis, caseId);
              
              if (analysisResult.error) {
                console.error("Analysis generation failed:", analysisResult.error);
                toast({
                  title: "Analysis Generation Failed",
                  description: "Chat imported successfully, but analysis generation failed. You can generate it manually.",
                  variant: "destructive",
                });
              } else {
                console.log("✅ Legal analysis generated successfully for migrated conversation");
                toast({
                  title: "Import Complete",
                  description: "Client, case, and chat history imported with legal analysis generated successfully",
                });
              }
            } catch (analysisError) {
              console.error("Error during analysis generation:", analysisError);
              toast({
                title: "Analysis Generation Error",
                description: "Chat imported successfully, but analysis generation failed. You can generate it manually.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Import Complete",
              description: "Client, case, and chat history imported successfully",
            });
          }
        } catch (migrationError) {
          console.error("Failed to migrate messages:", migrationError);
          toast({
            title: "Warning",
            description: "Client and case created successfully, but chat history migration failed",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Client ${clientData.first_name} ${clientData.last_name} and case "${caseData.case_title}" created successfully`,
        });
      }


      // Navigate to the new client detail page
      navigate(`/clients/${clientId}`);

      return { clientId, caseId };
    } catch (error) {
      console.error("Error creating client and case:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client and case",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createClientWithCase,
    isLoading,
  };
};