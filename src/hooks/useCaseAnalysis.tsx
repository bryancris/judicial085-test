
import { useState, useEffect } from "react";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import { useAnalysisData, AnalysisData } from "@/hooks/useAnalysisData";
import { useAnalysisGeneration } from "@/hooks/useAnalysisGeneration";

export type { CaseAnalysisData } from "@/types/caseAnalysis";

export const useCaseAnalysis = (clientId?: string, caseId?: string) => {
  const [clientMessages, setClientMessages] = useState<any[]>([]);
  
  // Use our hooks with case ID support
  const { 
    analysisData, 
    isLoading, 
    error, 
    fetchAnalysisData 
  } = useAnalysisData(clientId, caseId);
  
  const { 
    isGeneratingAnalysis, 
    generateRealTimeAnalysis 
  } = useAnalysisGeneration(clientId, caseId);

  // Load data on initial render
  useEffect(() => {
    if (clientId) {
      console.log("useCaseAnalysis: Loading analysis data for client:", clientId, "case:", caseId);
      fetchAnalysisData();
    }
  }, [clientId, caseId, fetchAnalysisData]);

  // Create a wrapper function that matches the expected interface
  const generateNewAnalysis = async () => {
    console.log("useCaseAnalysis: Generating new analysis...");
    await generateRealTimeAnalysis(
      async () => {
        console.log("useCaseAnalysis: Analysis complete callback - refetching data");
        await fetchAnalysisData();
      }
    );
  };

  // Combine loading states
  const combinedIsLoading = isLoading || isGeneratingAnalysis;

  console.log("useCaseAnalysis state:", {
    hasAnalysisData: !!analysisData,
    isLoading: combinedIsLoading,
    error,
    clientId,
    caseId
  });

  // Provide a unified API that matches the original hook
  return {
    analysisData,
    isLoading: combinedIsLoading,
    error,
    generateNewAnalysis
  };
};
