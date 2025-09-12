
import { useState } from "react";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { saveLegalAnalysis } from "@/utils/api/legalContentApiService";

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

      const result = await generateLegalAnalysis(
        clientId,
        emptyConversation,
        caseId,
        'step-2-preliminary',
        { stepType: 'preliminary-analysis', skipCoordinator: false }
      );
      
      if (result.error) {
        console.error("Analysis generation failed:", result.error);
        
        // Handle insufficient facts specifically
        if (result.error.includes("Insufficient facts") || result.error.includes("INSUFFICIENT_FACTS")) {
          toast({
            title: "Cannot Generate Analysis",
            description: "Please add more case details or upload documents before generating analysis.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle hypothetical content detection
        if (result.error.includes("hypothetical") || result.error.includes("HYPOTHETICAL_CONTENT")) {
          toast({
            title: "Analysis Blocked",
            description: "Generated content appears too generic. Please provide more specific case facts.",
            variant: "destructive",
          });
          return;
        }
        // Handle IRAC being blocked for non-Step 5
        if (result.error.includes("IRAC_NOT_ALLOWED") || result.error.toLowerCase().includes("irac format detected")) {
          toast({
            title: "IRAC Blocked for Step 2",
            description: "The system detected IRAC formatting and blocked it. Retrying will enforce Step 2 (preliminary) format.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Analysis Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Analysis generation completed successfully");
      // Save the generated analysis (validated) via secure service
      const timestamp = new Date().toISOString();
      const saveResult = await saveLegalAnalysis(
        clientId,
        result.analysis,
        timestamp,
        {
          caseId,
          analysisType: "step-2-preliminary", // FIXED: Always use correct Step 2 analysis type
          lawReferences: result.lawReferences || [],
          documentsUsed: result.documentsUsed || [],
          factSources: result.factSources || [],
          citations: result.citations || []
        }
      );
      if (!saveResult.success) {
        console.error("❌ Failed to save validated analysis:", saveResult.error || saveResult.validation);
        toast({
          title: "Save Failed",
          description: saveResult.error || "Validation failed while saving analysis.",
          variant: "destructive",
        });
        return;
      }
      console.log("✅ Analysis validated and saved, id:", saveResult.analysisId);
      // Show success message
      toast({
        title: "Analysis Complete",
        description: `Legal analysis has been generated and saved${caseId ? ' for this case' : ''}.`,
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
