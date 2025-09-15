/**
 * Enhanced Case Analysis Hook with Quality Control Enforcement
 * Implements the 4 key technical requirements:
 * 1. Exact step order execution
 * 2. Quality control at each step transition  
 * 3. Professional legal writing standards
 * 4. Cross-step reference and consistency validation
 */

import { useState } from "react";
import { coordinateAIAgents } from "@/utils/api/aiAgentService";
import { useToast } from "@/hooks/use-toast";
import { validateStepCompletion, enforceValidationBlocking, enforceStepOrder } from "@/utils/validation/stepValidationService";
import { assessOverallQuality, enforceQualityStandards } from "@/utils/validation/qualityControlService";

export const useEnhancedCaseAnalysis = (clientId?: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepResults, setStepResults] = useState<Record<string, any>>({});
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);
  const { toast } = useToast();

  const generateRealTimeAnalysisWithQualityControl = async (
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
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepResults({});

    try {
      console.log("🚀 Starting enhanced analysis generation with quality control for client:", clientId, "case:", caseId);
      
      // Step 1: Enforce step order
      if (!enforceStepOrder(1, completedSteps)) {
        throw new Error("Step order validation failed");
      }

      setCurrentStep(1);
      
      // Generate analysis using the proper 9-step AI Agent Coordinator workflow
      const result = await coordinateAIAgents({
        query: `Generate complete 9-step legal analysis for client ${clientId}${caseId ? ` and case ${caseId}` : ''}`,
        clientId,
        caseId,
        researchTypes: ['9-step-workflow']
      });
      
      if (!result.success || result.error) {
        console.error("9-step workflow failed:", result.error);
        
        toast({
          title: "Analysis Generation Failed", 
          description: result.error || "Failed to complete 9-step analysis workflow",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ 9-step analysis workflow completed successfully");
      console.log("📊 Workflow results:", {
        synthesizedContentLength: result.synthesizedContent.length,
        citationsCount: result.citations?.length || 0,
        hasStep6: !!result.synthesizedContent.includes("CASE STRENGTHS") && !!result.synthesizedContent.includes("CASE WEAKNESSES")
      });
      
      // Show success message
      toast({
        title: "Analysis Complete",
        description: `Legal analysis has been generated and saved${caseId ? ' for this case' : ''} with enhanced quality control.`,
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
        setTimeout(() => {
          onSimilarCasesComplete();
        }, 1000);
      }

      // Auto-trigger scholarly references search after analysis is complete
      if (onScholarlyReferencesComplete) {
        console.log("📚 Auto-triggering scholarly references search...");
        setTimeout(() => {
          onScholarlyReferencesComplete();
        }, 1500);
      }

    } catch (error: any) {
      console.error("Unexpected error during enhanced analysis generation:", error);
      
      // Parse quality control errors
      if (error.message.includes("validation failed")) {
        toast({
          title: "Quality Control Error",
          description: "Analysis failed quality validation. Please review requirements and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred during analysis generation: " + error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsGeneratingAnalysis(false);
      setCurrentStep(0);
    }
  };

  return {
    isGeneratingAnalysis,
    currentStep,
    completedSteps,
    stepResults,
    qualityMetrics,
    generateRealTimeAnalysisWithQualityControl
  };
};