import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface RiskFactor {
  level: 'high' | 'medium' | 'low';
  description: string;
}

interface RefinedAnalysisData {
  executiveSummary: string;
  riskAssessment: {
    highRiskFactors: string[];
    mediumRiskFactors: string[];
    riskMitigation: string[];
  };
  strategicRecommendations: {
    primaryStrategy: string;
    alternativeStrategies: string[];
    immediatePriorities: string[];
  };
  likelihoodOfSuccess: {
    percentage: number;
    reasoning: string;
  };
}

interface RefinedAnalysisSectionProps {
  analysisData: RefinedAnalysisData | null;
  isLoading?: boolean;
}

const RefinedAnalysisSection: React.FC<RefinedAnalysisSectionProps> = ({
  analysisData,
  isLoading = false
}) => {
  const executiveSummaryHtml = useMemo(() => {
    if (!analysisData?.executiveSummary) return "";
    const md = analysisData.executiveSummary.trim();
    try {
      const html = marked.parse(md, { breaks: true });
      return DOMPurify.sanitize(typeof html === "string" ? html : String(html));
    } catch (e) {
      return DOMPurify.sanitize(`<p>${md.replace(/\n/g, "<br/>")}</p>`);
    }
  }, [analysisData?.executiveSummary]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-56 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="text-muted-foreground">Step 7:</span>
            Refined Analysis (Comprehensive synthesis + Risk Assessment)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No refined analysis available.</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getSuccessColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span className="text-muted-foreground">Step 7:</span>
          Refined Analysis (Comprehensive synthesis + Risk Assessment)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: executiveSummaryHtml }} />
        </div>

        {/* Risk Assessment */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </h4>
          <div className="space-y-4">
            {analysisData.riskAssessment.highRiskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">High Risk Factors</h5>
                <ul className="space-y-1">
                  {analysisData.riskAssessment.highRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge className={getRiskColor('high')}>High</Badge>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisData.riskAssessment.mediumRiskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Medium Risk Factors</h5>
                <ul className="space-y-1">
                  {analysisData.riskAssessment.mediumRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge className={getRiskColor('medium')}>Medium</Badge>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisData.riskAssessment.riskMitigation.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Risk Mitigation</h5>
                <ul className="space-y-1 text-sm">
                  {analysisData.riskAssessment.riskMitigation.map((mitigation, index) => (
                    <li key={index}>• {mitigation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Strategic Recommendations
          </h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-xs font-medium mb-2">Primary Strategy</h5>
              <p className="text-sm">{analysisData.strategicRecommendations.primaryStrategy}</p>
            </div>
            
            {analysisData.strategicRecommendations.alternativeStrategies.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Alternative Strategies</h5>
                <ul className="space-y-1 text-sm">
                  {analysisData.strategicRecommendations.alternativeStrategies.map((strategy, index) => (
                    <li key={index}>• {strategy}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisData.strategicRecommendations.immediatePriorities.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Immediate Priorities</h5>
                <ul className="space-y-1 text-sm">
                  {analysisData.strategicRecommendations.immediatePriorities.map((priority, index) => (
                    <li key={index}>• {priority}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Likelihood of Success */}
        <div>
          <h4 className="font-medium text-sm mb-3">Likelihood of Success</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getSuccessColor(analysisData.likelihoodOfSuccess.percentage)}`}>
                {analysisData.likelihoodOfSuccess.percentage}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{analysisData.likelihoodOfSuccess.reasoning}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefinedAnalysisSection;