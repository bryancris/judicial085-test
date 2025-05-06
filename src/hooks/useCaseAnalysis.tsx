
import { useState, useEffect } from "react";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useAnalysisGeneration } from "@/hooks/useAnalysisGeneration";

export { CaseAnalysisData } from "@/types/caseAnalysis";

export const useCaseAnalysis = (clientId?: string) => {
  const [clientMessages, setClientMessages] = useState<any[]>([]);
  
  // Use our new hooks
  const { 
    analysisData, 
    isLoading, 
    error, 
    fetchAnalysisData 
  } = useAnalysisData(clientId);
  
  const { 
    generateNewAnalysis: generateNew, 
    isGenerating 
  } = useAnalysisGeneration(clientId, fetchAnalysisData);

  // Load data on initial render
  useEffect(() => {
    if (clientId) {
      fetchAnalysisData();
    }
  }, [clientId]);

  // Combine loading states
  const combinedIsLoading = isLoading || isGenerating;

  // Provide a unified API that matches the original hook
  return {
    analysisData,
    isLoading: combinedIsLoading,
    error,
    generateNewAnalysis: generateNew
  };
};
