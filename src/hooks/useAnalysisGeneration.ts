
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { TablesInsert } from "@/integrations/supabase/types";

export const useAnalysisGeneration = (clientId?: string, caseId?: string, onSuccess?: () => void) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateNewAnalysis = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client ID provided for analysis generation",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // First, fetch the client messages for this client
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      // Check if we have a conversation or should use documents
      const hasConversation = messages && messages.length > 0;
      
      if (!hasConversation) {
        // Check for documents marked for analysis
        const documentsQuery = supabase
          .from("document_metadata")
          .select("id, title, include_in_analysis")
          .eq("client_id", clientId)
          .eq("include_in_analysis", true);
        
        // If we have a specific case, filter by case_id, otherwise get all client documents
        if (caseId) {
          documentsQuery.eq("case_id", caseId);
        }
        
        const { data: documents, error: documentsError } = await documentsQuery;
        
        if (documentsError) throw documentsError;
        
        if (!documents || documents.length === 0) {
          throw new Error("No client conversation or documents marked for analysis found. Please either start a conversation with the client or upload documents and mark them for inclusion in analysis.");
        }
        
        console.log(`Found ${documents.length} documents marked for analysis`);
      }
      
      // Format messages for the analysis (empty array if no conversation)
      const formattedMessages = hasConversation ? messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      })) : [];
      
      // CRITICAL: Complete cleanup of existing analyses
      console.log("Performing complete cleanup of existing analyses...");
      
      // Delete ALL existing analyses for this client first
      let deleteQuery = supabase
        .from("legal_analyses")
        .delete()
        .eq("client_id", clientId);
      
      // If we have a case ID, delete both case-specific AND client-level analyses
      if (caseId) {
        // Delete case-specific analyses
        const { error: caseDeleteError } = await supabase
          .from("legal_analyses")
          .delete()
          .eq("client_id", clientId)
          .eq("case_id", caseId);
          
        if (caseDeleteError) {
          console.error("Error deleting case-specific analyses:", caseDeleteError);
        }
        
        // Also delete any client-level analyses to ensure clean state
        const { error: clientDeleteError } = await supabase
          .from("legal_analyses")
          .delete()
          .eq("client_id", clientId)
          .is("case_id", null);
          
        if (clientDeleteError) {
          console.error("Error deleting client-level analyses:", clientDeleteError);
        }
      } else {
        // Delete all analyses for this client
        const { error: deleteError } = await deleteQuery;
        if (deleteError) {
          console.error("Error deleting all client analyses:", deleteError);
        }
      }
      
      console.log("Cleanup completed, generating fresh analysis...");

      // Call the edge function to generate a new analysis
      const { analysis, lawReferences, error: analysisError } = await generateLegalAnalysis(
        clientId, 
        formattedMessages,
        caseId // Pass case ID for case-specific document analysis
      );
      
      if (analysisError) throw new Error(analysisError);
      
      if (analysis && lawReferences) {
        // Save the new analysis to the database with proper law references
        const timestamp = new Date().toISOString();
        
        // Create the analysis data with proper typing and law references
        const analysisData: TablesInsert<"legal_analyses"> = {
          client_id: clientId,
          content: analysis,
          timestamp,
          law_references: lawReferences, // Ensure law references are properly saved
          user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous"
        };
        
        // Add case_id if this is case-specific analysis
        if (caseId) {
          analysisData.case_id = caseId;
        }
        
        console.log("Saving NEW analysis with law references:", lawReferences);
        
        const { error: saveError, data: savedData } = await supabase
          .from("legal_analyses")
          .insert(analysisData)
          .select();
          
        if (saveError) {
          console.error("Error saving new analysis:", saveError);
          throw saveError;
        }
        
        console.log("Successfully saved NEW analysis:", savedData);
        console.log("Law references in saved data:", savedData?.[0]?.law_references);
        
        const analysisType = hasConversation ? "conversation" : "documents";
        
        toast({
          title: "Analysis Generated",
          description: `A fresh case analysis has been generated from ${analysisType} with ${lawReferences?.length || 0} law references.`,
        });
        
        // Call the success callback (which should refresh the data)
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error("Failed to generate analysis content or law references");
      }
    } catch (err: any) {
      console.error("Error generating analysis:", err);
      setGenerationError(err.message || "Failed to generate analysis");
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate a new analysis.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateNewAnalysis,
    isGenerating,
    generationError
  };
};
