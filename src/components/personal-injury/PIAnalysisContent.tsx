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
    isAnalyzingDocuments, 
    hasDocuments, 
    hasAnalysisData 
  } = useCaseStrengthAnalysis(clientId);

  useEffect(() => {
    checkDocumentStatus();
  }, [clientId]);
  // Use real analysis data if available, otherwise fall back to mock data
  const piData = getMockPIData();
  
  // Convert analysis metrics to display format if available
  const displayMetrics = analysisMetrics ? {
    caseStrength: analysisMetrics.overallStrength * 10,
    settlementRangeLow: analysisMetrics.settlementRangeLow,
    settlementRangeHigh: analysisMetrics.settlementRangeHigh,
    daysSinceIncident: piData.metrics.daysSinceIncident, // Keep mock data for now
    medicalRecordCompletion: piData.metrics.medicalRecordCompletion // Keep mock data for now
  } : piData.metrics;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Personal Injury Case Dashboard</h1>
        <p className="text-muted-foreground">
          {analysisMetrics ? 'Real-time case analysis results' : 'Comprehensive overview of case status and key metrics'}
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
            <span>Documents are ready for analysis. Click "Analyze Documents" to extract case data.</span>
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

      {analysisMetrics && (
        <div className="mt-6 space-y-4">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Analysis Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Strengths ({analysisMetrics.strengths.length})</h4>
                <ul className="text-sm space-y-1">
                  {analysisMetrics.strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="text-green-600">• {strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Risk Factors ({analysisMetrics.riskFactors.length})</h4>
                <ul className="text-sm space-y-1">
                  {analysisMetrics.riskFactors.slice(0, 3).map((risk, index) => (
                    <li key={index} className="text-red-600">• {risk}</li>
                  ))}
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