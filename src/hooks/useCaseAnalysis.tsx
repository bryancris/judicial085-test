
import { useState, useEffect } from "react";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { useEnhancedCaseAnalysis } from "@/hooks/useEnhancedCaseAnalysis";
import { searchSimilarCases } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

        // Kick off lightweight Step 7 generator to create refined analysis
        try {
          console.log("useCaseAnalysis: Invoking generate-refined-analysis for Step 7...");
          const { data, error } = await supabase.functions.invoke('generate-refined-analysis', {
            body: { clientId, caseId }
          });
          if (error) {
            console.error("useCaseAnalysis: generate-refined-analysis failed", error);
          } else {
            console.log("useCaseAnalysis: Step 7 generation response:", data);
          }
          // Re-fetch to pick up the saved Step 7 record (if any)
          await fetchAnalysisData();

          // Show success if the function reported substantial content
          const contentLen = (data as any)?.contentLength ?? 0;
          if (contentLen > 200) {
            toast({ title: "Refined Analysis Ready", description: "Step 7 generated successfully." });
          } else if (analysisData?.refinedAnalysisRaw && analysisData.refinedAnalysisRaw.length > 50) {
            toast({ title: "Refined Analysis Ready", description: "Step 7 generated successfully." });
          } else {
            console.log("useCaseAnalysis: Step 7 not detected yet after generation; skipping success toast.");
          }
        } catch (e) {
          console.error("useCaseAnalysis: generate-refined-analysis invocation failed", e);
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
