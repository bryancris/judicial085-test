
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
      
      // Call the edge function to generate a new analysis
      // Pass additional parameters to indicate document-based analysis
      const { analysis, lawReferences, error: analysisError } = await generateLegalAnalysis(
        clientId, 
        formattedMessages,
        caseId // Pass case ID for case-specific document analysis
      );
      
      if (analysisError) throw new Error(analysisError);
      
      if (analysis) {
        // First delete any existing analyses for this client
        const deleteQuery = supabase
          .from("legal_analyses")
          .delete()
          .eq("client_id", clientId);
        
        // If we have a case ID, also filter by case_id for case-specific analysis
        if (caseId) {
          deleteQuery.eq("case_id", caseId);
        }
        
        const { error: deleteError } = await deleteQuery;
          
        if (deleteError) {
          console.error("Error deleting previous analyses:", deleteError);
          // Continue with the insert even if delete fails
        }

        // Save the new analysis to the database
        const timestamp = new Date().toISOString();
        
        // Create the analysis data with proper typing
        const analysisData: TablesInsert<"legal_analyses"> = {
          client_id: clientId,
          content: analysis,
          timestamp,
          law_references: lawReferences || [],
          user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous"
        };
        
        // Add case_id if this is case-specific analysis
        if (caseId) {
          analysisData.case_id = caseId;
        }
        
        const { error: saveError } = await supabase
          .from("legal_analyses")
          .insert(analysisData);
          
        if (saveError) throw saveError;
        
        const analysisType = hasConversation ? "conversation" : "documents";
        
        toast({
          title: "Analysis Generated",
          description: `A new case analysis has been generated from ${analysisType} and replaced any previous analysis.`,
        });
        
        // Call the success callback (which should refresh the data)
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error("Failed to generate analysis content");
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
