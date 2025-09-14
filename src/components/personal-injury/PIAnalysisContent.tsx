import React, { useEffect } from "react";
import PIMetricsHeader from "./PIMetricsHeader";
import PIIncidentOverview from "./PIIncidentOverview";
import PIMedicalStatus from "./PIMedicalStatus";
import PIFunctionalImpact from "./PIFunctionalImpact";
import PIFinancialImpact from "./PIFinancialImpact";
import { getMockPIData } from "@/services/personalInjuryMockData";
import { CaseStrengthMetrics } from "@/services/personalInjury/caseStrengthAnalyzer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { useCaseStrengthAnalysis } from "@/hooks/useCaseStrengthAnalysis";

interface PIAnalysisContentProps {
  clientId: string;
  caseId?: string;
  analysisMetrics?: CaseStrengthMetrics | null;
  isAnalyzing?: boolean;
  analysisError?: string | null;
}

const PIAnalysisContent: React.FC<PIAnalysisContentProps> = ({ 
  clientId, 
  caseId, 
  analysisMetrics, 
  isAnalyzing, 
  analysisError 
}) => {
  const { 
    analyzeDocuments, 
    checkDocumentStatus, 
    loadExistingMetrics,
    isAnalyzingDocuments, 
    hasDocuments, 
    hasAnalysisData,
    metrics: loadedMetrics
  } = useCaseStrengthAnalysis(clientId);

  // Use loaded metrics if available, otherwise fall back to prop metrics
  const currentMetrics = loadedMetrics || analysisMetrics;

  useEffect(() => {
    checkDocumentStatus();
    loadExistingMetrics();
  }, [clientId]);
  // Get mock data as fallback
  const piData = getMockPIData();
  
  // Use real metrics if available, otherwise use mock data
  const displayMetrics = currentMetrics ? {
    caseStrength: currentMetrics.overallStrength * 10, // Convert 0-1 to 0-10 scale
    settlementRangeLow: currentMetrics.settlementRangeLow,
    settlementRangeHigh: currentMetrics.settlementRangeHigh,
    daysSinceIncident: piData.metrics.daysSinceIncident, // TODO: Calculate from incident data
    medicalRecordCompletion: piData.metrics.medicalRecordCompletion // TODO: Get from medical analysis
  } : piData.metrics;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Personal Injury Case Dashboard</h1>
        <p className="text-muted-foreground">
          {currentMetrics ? 'Real-time case analysis results' : 'Comprehensive overview of case status and key metrics'}
        </p>
      </div>

      {isAnalyzing && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Analyzing case strength and generating settlement estimates...
          </AlertDescription>
        </Alert>
      )}

      {analysisError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {analysisError}
          </AlertDescription>
        </Alert>
      )}

      {hasDocuments && !hasAnalysisData && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Documents are ready for analysis. Click "Analyze Documents" to extract case data and timeline events.</span>
            <Button 
              onClick={analyzeDocuments}
              disabled={isAnalyzingDocuments}
              size="sm"
              className="ml-4"
            >
              {isAnalyzingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Analyze Documents
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasDocuments && hasAnalysisData && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Analysis complete. You can re-analyze documents if new documents have been added or to refresh the data.</span>
            <Button 
              onClick={analyzeDocuments}
              disabled={isAnalyzingDocuments}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              {isAnalyzingDocuments ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Re-analyze Documents
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!hasDocuments && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No documents found for analysis. Please upload and process documents first.
          </AlertDescription>
        </Alert>
      )}

      <PIMetricsHeader metrics={displayMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PIIncidentOverview incident={piData.incident} />
        <PIMedicalStatus medical={piData.medical} />
        <PIFunctionalImpact functional={piData.functional} />
        <PIFinancialImpact financial={piData.financial} />
      </div>

      {currentMetrics && (
        <div className="mt-6 space-y-4">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Analysis Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Strengths ({currentMetrics.strengths.length})</h4>
                <ul className="text-sm space-y-1">
                  {currentMetrics.strengths.length > 0 ? currentMetrics.strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="text-green-600">• {strength}</li>
                  )) : (
                    <li className="text-muted-foreground text-sm">Analysis complete - detailed strengths will be populated in future updates</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Risk Factors ({currentMetrics.riskFactors.length})</h4>
                <ul className="text-sm space-y-1">
                  {currentMetrics.riskFactors.length > 0 ? currentMetrics.riskFactors.slice(0, 3).map((risk, index) => (
                    <li key={index} className="text-red-600">• {risk}</li>
                  )) : (
                    <li className="text-muted-foreground text-sm">Analysis complete - detailed risk factors will be populated in future updates</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PIAnalysisContent;