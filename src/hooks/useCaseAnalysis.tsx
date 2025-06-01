
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
    generateNewAnalysis: generateNew, 
    isGenerating 
  } = useAnalysisGeneration(clientId, caseId, fetchAnalysisData);

  // Load data on initial render
  useEffect(() => {
    if (clientId) {
      fetchAnalysisData();
    }
  }, [clientId, caseId]);

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
