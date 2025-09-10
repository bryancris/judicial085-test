
import { useState, useEffect } from "react";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useEnhancedCaseAnalysis } from "@/hooks/useEnhancedCaseAnalysis";
import { searchSimilarCases } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { coordinateAIAgents } from "@/utils/api/aiAgentService";

export type { CaseAnalysisData } from "@/types/caseAnalysis";

export const useCaseAnalysis = (clientId?: string, caseId?: string) => {
  const [clientMessages, setClientMessages] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Use our hooks with case ID support
  const { 
    analysisData, 
    isLoading: isAnalysisLoading, 
    error: analysisError, 
    fetchAnalysisData 
  } = useAnalysisData(clientId, caseId);
  
  const {
    isGeneratingAnalysis,
    generateRealTimeAnalysisWithQualityControl
  } = useEnhancedCaseAnalysis(clientId, caseId);


  // Load data on initial render
  useEffect(() => {
    if (clientId) {
      console.log("useCaseAnalysis: Loading analysis data for client:", clientId, "case:", caseId);
      fetchAnalysisData();
    }
  }, [clientId, caseId, fetchAnalysisData]);

  // Function to search for similar cases after analysis is complete
  const searchSimilarCasesAfterAnalysis = async () => {
    if (!clientId) return;
    
    try {
      // Add a small delay to ensure analysis is fully saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("useCaseAnalysis: Searching for similar cases...");
      const result = await searchSimilarCases(clientId);
      
      if (result.error) {
        console.error("Error searching similar cases:", result.error);
        toast({
          title: "Similar Cases Search Failed",
          description: result.error || "Failed to search for similar cases.",
          variant: "destructive",
        });
      } else {
        console.log("useCaseAnalysis: Similar cases search completed:", result.similarCases.length, "cases found");
        if (result.similarCases.length > 0) {
          toast({
            title: "Similar Cases Found",
            description: `Found ${result.similarCases.length} similar cases`,
          });
        }
      }
    } catch (error) {
      console.error("Error in similar cases search:", error);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred while searching for similar cases.",
        variant: "destructive",
      });
    }
  };

  // Create a wrapper function that matches the expected interface
  const generateNewAnalysis = async () => {
    console.log("useCaseAnalysis: Generating new analysis...");
    await generateRealTimeAnalysisWithQualityControl(
      async () => {
        console.log("useCaseAnalysis: Analysis complete callback - refetching data");
        await fetchAnalysisData();

        // Kick off 9-step coordinator to ensure Step 7 is created
        try {
          console.log("useCaseAnalysis: Invoking 9-step coordinator for refined Step 7...");
          await coordinateAIAgents({
            query: `Comprehensive case refinement and practical counsel for client ${clientId}${caseId ? `, case ${caseId}` : ''}`,
            clientId,
            caseId,
            researchTypes: ["legal-research", "current-research"],
          });
          // Re-fetch to pick up the saved Step 7 record
          await fetchAnalysisData();
          toast({ title: "Refined Analysis Ready", description: "Step 7 generated successfully." });
        } catch (e) {
          console.error("useCaseAnalysis: Coordinator invocation failed", e);
        }

        // Auto-trigger similar cases search after analysis is complete
        setTimeout(searchSimilarCasesAfterAnalysis, 1000);
      },
      searchSimilarCasesAfterAnalysis
    );
  };

  // Combine loading states
  const combinedIsLoading = isAnalysisLoading || isGeneratingAnalysis;

  console.log("useCaseAnalysis state:", {
    hasAnalysisData: !!analysisData,
    isLoading: combinedIsLoading,
    error: analysisError,
    clientId,
    caseId
  });

  // Provide a unified API that matches the original hook
  return {
    analysisData,
    isLoading: combinedIsLoading,
    error: analysisError,
    generateNewAnalysis
  };
};
