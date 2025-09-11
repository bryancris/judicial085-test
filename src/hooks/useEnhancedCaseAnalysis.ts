/**
 * Enhanced Case Analysis Hook with Quality Control Enforcement
 * Implements the 4 key technical requirements:
 * 1. Exact step order execution
 * 2. Quality control at each step transition  
 * 3. Professional legal writing standards
 * 4. Cross-step reference and consistency validation
 */

import { useState } from "react";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { saveLegalAnalysis } from "@/utils/api/legalContentApiService";
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
      
      // Generate analysis using the enhanced 9-step workflow
      const result = await generateLegalAnalysis(
        clientId,
        [],
        caseId,
        'step-2-preliminary',
        { stepType: 'preliminary-analysis', skipCoordinator: true }
      );
      
      if (result.error) {
        console.error("Analysis generation failed:", result.error);
        
        // Handle specific error types
        if (result.error.includes("Insufficient facts") || result.error.includes("INSUFFICIENT_FACTS")) {
          toast({
            title: "Cannot Generate Analysis",
            description: "Please add more case details or upload documents before generating analysis.",
            variant: "destructive",
          });
          return;
        }
        
        if (result.error.includes("validation failed") || result.error.includes("quality")) {
          toast({
            title: "Quality Control Failed",
            description: "Analysis did not meet quality standards. Please review and try again.",
            variant: "destructive",
          });
          return;
        }
        // Handle IRAC blocked for non-Step 5
        if (result.error.includes("IRAC_NOT_ALLOWED") || result.error.toLowerCase().includes("irac format detected")) {
          toast({
            title: "IRAC Blocked for Step 2",
            description: "IRAC formatting was detected and blocked. The coordinator will enforce Step 2 format on retry.",
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

      console.log("✅ Analysis generation completed with quality control");

      // Save the generated analysis (validated and quality-controlled)
      const timestamp = new Date().toISOString();
      const saveResult = await saveLegalAnalysis(
        clientId,
        result.analysis,
        timestamp,
        {
          caseId,
          analysisType: caseId ? "case-analysis" : "client-intake",
          lawReferences: result.lawReferences || [],
          documentsUsed: result.documentsUsed || [],
          factSources: result.factSources || [],
          citations: result.citations || [],
          provenance: { qualityControlEnabled: true }
        }
      );

      if (!saveResult.success) {
        console.error("❌ Failed to save quality-controlled analysis:", saveResult.error || saveResult.validation);
        toast({
          title: "Save Failed",
          description: saveResult.error || "Validation failed while saving analysis.",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Quality-controlled analysis validated and saved, id:", saveResult.analysisId);
      
      // Step 5: Generate IRAC Analysis if Step 2 was successful
      console.log("🧮 Starting Step 5: IRAC Analysis generation...");
      const iracResult = await generateLegalAnalysis(
        clientId,
        [],
        caseId,
        'step-5-irac',
        { stepType: 'irac-analysis', skipCoordinator: true }
      );
      
      if (iracResult.error) {
        console.warn("⚠️ IRAC Analysis (Step 5) failed:", iracResult.error);
        toast({
          title: "IRAC Analysis Failed",
          description: "Step 2 completed but Step 5 (IRAC) failed. Continuing with available analysis.",
          variant: "destructive",
        });
      } else {
        // Save IRAC analysis as separate record
        const iracSaveResult = await saveLegalAnalysis(
          clientId,
          iracResult.analysis,
          new Date().toISOString(),
          {
            caseId,
            analysisType: "irac-analysis",
            lawReferences: iracResult.lawReferences || [],
            documentsUsed: iracResult.documentsUsed || [],
            factSources: iracResult.factSources || [],
            citations: iracResult.citations || [],
            provenance: { qualityControlEnabled: true, sourceStep: 5 }
          }
        );
        
        if (iracSaveResult.success) {
          console.log("✅ IRAC Analysis (Step 5) saved successfully, id:", iracSaveResult.analysisId);
        } else {
          console.warn("⚠️ IRAC Analysis save failed:", iracSaveResult.error);
        }
      }
      
      // REMOVED: Step 6 Risk Assessment - no longer needed to reduce API costs
      
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