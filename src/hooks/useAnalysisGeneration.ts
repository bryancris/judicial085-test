
import { useState } from "react";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";

export const useAnalysisGeneration = (clientId?: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const { toast } = useToast();

  const generateRealTimeAnalysis = async (
    onAnalysisComplete?: () => Promise<void>,
    onSimilarCasesComplete?: () => void,
    onScholarlyReferencesComplete?: () => void
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
      console.log("Starting real-time analysis generation for client:", clientId, "case:", caseId);
      
      // Don't fetch messages here - let the edge function handle the fallback logic
      // Just pass an empty conversation array and let the backend fetch what it needs
      const emptyConversation = [];

      console.log("Sending empty conversation to edge function - it will handle message fetching");

      const result = await generateLegalAnalysis(clientId, emptyConversation, caseId, caseId ? 'case-analysis' : 'client-analysis');
      
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
      
      // Show success message
      toast({
        title: "Analysis Complete",
        description: `Legal analysis has been generated successfully${caseId ? ' for this case' : ''}.`,
      });

      // Refresh analysis data first
      if (onAnalysisComplete) {
        console.log("Refreshing analysis data...");
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

      // Auto-trigger scholarly references search after analysis is complete
      if (onScholarlyReferencesComplete) {
        console.log("📚 Auto-triggering scholarly references search...");
        // Small delay to ensure analysis data is properly loaded
        setTimeout(() => {
          onScholarlyReferencesComplete();
        }, 1500);
      }

    } catch (error: any) {
      console.error("Unexpected error during analysis generation:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred during analysis generation: " + error.message,
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
