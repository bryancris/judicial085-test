
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
  const [isRegeneratingStep7, setIsRegeneratingStep7] = useState(false);
  const [isRegeneratingStep8, setIsRegeneratingStep8] = useState(false);
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

  // Individual Step 7 regeneration function
  const regenerateStep7 = async () => {
    if (!clientId || isRegeneratingStep7) return;
    
    setIsRegeneratingStep7(true);
    try {
      console.log("useCaseAnalysis: Regenerating Step 7 only...");
      const { data, error } = await supabase.functions.invoke('generate-refined-analysis', {
        body: { clientId, caseId }
      });
      
      if (error) {
        console.error("useCaseAnalysis: Step 7 regeneration failed", error);
        toast({
          title: "Step 7 Regeneration Failed",
          description: error.message || "Failed to regenerate refined analysis.",
          variant: "destructive",
        });
      } else {
        console.log("useCaseAnalysis: Step 7 regeneration response:", data);
        await fetchAnalysisData();
        
        const contentLen = (data as any)?.contentLength ?? 0;
        if (contentLen > 200) {
          toast({ 
            title: "Step 7 Regenerated", 
            description: "Refined analysis updated successfully." 
          });
        }
      }
    } catch (e) {
      console.error("useCaseAnalysis: Step 7 regeneration error", e);
      toast({
        title: "Step 7 Error",
        description: "An unexpected error occurred while regenerating refined analysis.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingStep7(false);
    }
  };

  // Individual Step 8 regeneration function
  const regenerateStep8 = async () => {
    if (!clientId || isRegeneratingStep8) return;
    
    setIsRegeneratingStep8(true);
    try {
      console.log("useCaseAnalysis: Regenerating Step 8 only...");
      const { data, error } = await supabase.functions.invoke('generate-followup-questions', {
        body: { clientId, caseId }
      });
      
      if (error) {
        console.error("useCaseAnalysis: Step 8 regeneration failed", error);
        toast({
          title: "Step 8 Regeneration Failed",
          description: error.message || "Failed to regenerate follow-up questions.",
          variant: "destructive",
        });
      } else {
        console.log("useCaseAnalysis: Step 8 regeneration response:", data);
        await fetchAnalysisData();
        
        const contentLen = (data as any)?.contentLength ?? 0;
        if (contentLen > 100) {
          toast({ 
            title: "Step 8 Regenerated", 
            description: "Follow-up questions updated successfully." 
          });
        }
      }
    } catch (e) {
      console.error("useCaseAnalysis: Step 8 regeneration error", e);
      toast({
        title: "Step 8 Error",
        description: "An unexpected error occurred while regenerating follow-up questions.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingStep8(false);
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
    generateNewAnalysis,
    regenerateStep7,
    regenerateStep8,
    isRegeneratingStep7,
    isRegeneratingStep8
  };
};
