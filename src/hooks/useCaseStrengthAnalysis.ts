import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CaseStrengthAnalyzer, CaseStrengthMetrics } from "@/services/personalInjury/caseStrengthAnalyzer";
import { supabase } from "@/integrations/supabase/client";

export const useCaseStrengthAnalysis = (clientId?: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingDocuments, setIsAnalyzingDocuments] = useState(false);
  const [metrics, setMetrics] = useState<CaseStrengthMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [hasAnalysisData, setHasAnalysisData] = useState(false);
  const { toast } = useToast();

  const analyzer = new CaseStrengthAnalyzer();

  const analyzeCase = async () => {
    if (!clientId) {
      setError("Client ID is required for analysis");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      console.log("🚀 Starting case strength analysis for client:", clientId);
      
      const analysisResult = await analyzer.analyzeCaseStrength(clientId);
      
      setMetrics(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: `Case strength: ${(analysisResult.overallStrength * 10).toFixed(1)}/10, Settlement range: $${analysisResult.settlementRangeLow.toLocaleString()} - $${analysisResult.settlementRangeHigh.toLocaleString()}`,
      });

      return analysisResult;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze case strength";
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDocuments = async () => {
    if (!clientId) {
      setError("Client ID is required for document analysis");
      return false;
    }

    setIsAnalyzingDocuments(true);
    setError(null);

    try {
      console.log("🔬 Starting document analysis for client:", clientId);
      
      const { data, error } = await supabase.functions.invoke('analyze-pi-documents', {
        body: { clientId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Document analysis failed');
      }

      toast({
        title: "Document Analysis Complete",
        description: `Processed ${data.results.medicalAnalyses} medical documents, ${data.results.legalAnalyses} legal documents, and extracted ${data.results.timelineEvents} timeline events.`,
      });

      // Check analysis data status after processing
      await checkAnalysisDataStatus();
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to analyze documents";
      setError(errorMessage);
      
      toast({
        title: "Document Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsAnalyzingDocuments(false);
    }
  };

  const checkDocumentStatus = async () => {
    if (!clientId) return;

    try {
      // Check if client has document chunks
      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      setHasDocuments((chunks?.length ?? 0) > 0);

      await checkAnalysisDataStatus();
    } catch (error) {
      console.error("Error checking document status:", error);
    }
  };

  const checkAnalysisDataStatus = async () => {
    if (!clientId) return;

    try {
      const [medicalData, timelineData, caseMetrics] = await Promise.all([
        supabase.from('medical_document_analyses').select('id').eq('client_id', clientId).limit(1),
        supabase.from('pi_timeline_events').select('id').eq('client_id', clientId).limit(1),
        supabase.from('pi_case_metrics').select('id').eq('client_id', clientId).limit(1)
      ]);

      // Analysis is complete only when ALL required components are present
      const hasCompleteAnalysis = 
        (medicalData.data?.length ?? 0) > 0 && 
        (timelineData.data?.length ?? 0) > 0 && 
        (caseMetrics.data?.length ?? 0) > 0;

      setHasAnalysisData(hasCompleteAnalysis);
    } catch (error) {
      console.error("Error checking analysis data status:", error);
    }
  };

  const clearResults = () => {
    setMetrics(null);
    setError(null);
  };

  return {
    analyzeCase,
    analyzeDocuments,
    checkDocumentStatus,
    clearResults,
    isAnalyzing,
    isAnalyzingDocuments,
    metrics,
    error,
    hasDocuments,
    hasAnalysisData,
    // Computed values for easy access
    caseStrength: metrics?.overallStrength ?? 0,
    settlementRange: metrics ? `$${metrics.settlementRangeLow.toLocaleString()} - $${metrics.settlementRangeHigh.toLocaleString()}` : null,
    confidenceLevel: metrics?.confidenceLevel ?? 0,
    riskCount: metrics?.riskFactors.length ?? 0,
    strengthCount: metrics?.strengths.length ?? 0,
    recommendationCount: metrics?.recommendations.length ?? 0
  };
};