import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CaseStrengthAnalyzer, CaseStrengthMetrics } from "@/services/personalInjury/caseStrengthAnalyzer";

export const useCaseStrengthAnalysis = (clientId?: string) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<CaseStrengthMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const clearResults = () => {
    setMetrics(null);
    setError(null);
  };

  return {
    analyzeCase,
    clearResults,
    isAnalyzing,
    metrics,
    error,
    // Computed values for easy access
    caseStrength: metrics?.overallStrength ?? 0,
    settlementRange: metrics ? `$${metrics.settlementRangeLow.toLocaleString()} - $${metrics.settlementRangeHigh.toLocaleString()}` : null,
    confidenceLevel: metrics?.confidenceLevel ?? 0,
    riskCount: metrics?.riskFactors.length ?? 0,
    strengthCount: metrics?.strengths.length ?? 0,
    recommendationCount: metrics?.recommendations.length ?? 0
  };
};