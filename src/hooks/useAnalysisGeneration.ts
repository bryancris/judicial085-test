
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis } from "@/utils/openaiService";

export const useAnalysisGeneration = (clientId?: string, onSuccess?: () => void) => {
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
      
      if (!messages || messages.length === 0) {
        throw new Error("No client conversation found to analyze");
      }
      
      // Format messages for the analysis
      const formattedMessages = messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      }));
      
      // Call the edge function to generate a new analysis
      const { analysis, error: analysisError } = await generateLegalAnalysis(
        clientId, 
        formattedMessages
      );
      
      if (analysisError) throw new Error(analysisError);
      
      if (analysis) {
        // Save the new analysis to the database
        const timestamp = new Date().toISOString();
        const { error: saveError } = await supabase
          .from("legal_analyses")
          .insert({
            client_id: clientId,
            content: analysis,
            timestamp,
            user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous"
          });
          
        if (saveError) throw saveError;
        
        toast({
          title: "Analysis Generated",
          description: "A new case analysis has been generated successfully.",
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
