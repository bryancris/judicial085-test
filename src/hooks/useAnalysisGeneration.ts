
import { useState } from "react";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { useClientChatMessages } from "./useClientChatMessages";

export const useAnalysisGeneration = (clientId?: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const { toast } = useToast();
  const { messages } = useClientChatMessages(clientId);

  const generateRealTimeAnalysis = async (
    onAnalysisComplete?: () => Promise<void>,
    onSimilarCasesComplete?: () => void
  ) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required for analysis generation",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAnalysis(true);

    try {
      console.log("Starting real-time analysis generation for client:", clientId);
      
      const result = await generateLegalAnalysis(clientId, messages, caseId);
      
      if (result.error) {
        console.error("Analysis generation failed:", result.error);
        toast({
          title: "Analysis Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Analysis generation completed successfully");
      
      // Refresh analysis data first
      if (onAnalysisComplete) {
        await onAnalysisComplete();
        console.log("✅ Analysis data refreshed");
      }

      // Auto-trigger similar cases search after analysis is complete
      if (onSimilarCasesComplete) {
        console.log("🔍 Auto-triggering similar cases search...");
        // Small delay to ensure analysis data is properly loaded
        setTimeout(() => {
          onSimilarCasesComplete();
        }, 1000);
      }

      toast({
        title: "Analysis Complete",
        description: "Legal analysis has been generated successfully. Similar cases search initiated automatically.",
      });

    } catch (error: any) {
      console.error("Unexpected error during analysis generation:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred during analysis generation",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  return {
    isGeneratingAnalysis,
    generateRealTimeAnalysis
  };
};
