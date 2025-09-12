import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { RefinedAnalysisData } from "@/utils/refinedAnalysisParser";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface RefinedAnalysisSectionProps {
  analysisData: RefinedAnalysisData | null;
  refinedAnalysisRaw?: string | null;
  isLoading?: boolean;
  onRegenerateStep7?: () => void;
  isRegenerating?: boolean;
}

const RefinedAnalysisSection: React.FC<RefinedAnalysisSectionProps> = ({
  analysisData,
  refinedAnalysisRaw,
  isLoading = false,
  onRegenerateStep7,
  isRegenerating = false
}) => {
  const refinedAnalysisHtml = useMemo(() => {
    // Prioritize raw refined analysis content if available
    const content = refinedAnalysisRaw || analysisData?.executiveSummary || "";
    if (!content) return "";
    
    const md = content.trim();
    try {
      const html = marked.parse(md, { breaks: true });
      return DOMPurify.sanitize(typeof html === "string" ? html : String(html));
    } catch (e) {
      return DOMPurify.sanitize(`<p>${md.replace(/\n/g, "<br/>")}</p>`);
    }
  }, [refinedAnalysisRaw, analysisData?.executiveSummary]);

  console.log('🔍 RefinedAnalysisSection state:', {
    hasAnalysisData: !!analysisData,
    hasRefinedAnalysisRaw: !!refinedAnalysisRaw,
    refinedAnalysisRawLength: refinedAnalysisRaw?.length || 0,
    htmlLength: refinedAnalysisHtml.length,
    isLoading
  });

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

  // If we have raw refined analysis content, show it in freeform format
  if (refinedAnalysisRaw) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span className="text-muted-foreground">Step 7:</span>
            Refined Analysis (Strategic Synthesis)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="prose dark:prose-invert max-w-none step7-compact" 
               dangerouslySetInnerHTML={{ __html: refinedAnalysisHtml }} />
          {onRegenerateStep7 && (
            <div className="pt-4 border-t border-border">
              <Button 
                onClick={onRegenerateStep7} 
                disabled={isRegenerating}
                variant="outline" 
                size="sm"
                className="text-xs"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Step 7 Analysis
                  </>
                )}
              </Button>
            </div>
          )}
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
            Refined Analysis (Strategic Synthesis)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">No refined analysis available.</p>
          {onRegenerateStep7 && (
            <Button 
              onClick={onRegenerateStep7} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Generate Step 7 Analysis
            </Button>
          )}
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

  // Group risk factors by level
  const highRiskFactors = analysisData.riskAssessment.riskFactors.filter(f => f.level === 'high');
  const mediumRiskFactors = analysisData.riskAssessment.riskFactors.filter(f => f.level === 'medium');
  const lowRiskFactors = analysisData.riskAssessment.riskFactors.filter(f => f.level === 'low');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span className="text-muted-foreground">Step 7:</span>
          Refined Analysis (Comprehensive synthesis + Risk Assessment)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Executive Summary */}
        <div>
          <h4 className="font-medium text-xs mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="prose dark:prose-invert max-w-none step7-compact" dangerouslySetInnerHTML={{ __html: refinedAnalysisHtml }} />
        </div>

        {/* Risk Assessment */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </h4>
          <div className="space-y-4">
            {/* Overall Risk Level */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Overall Risk:</span>
              <Badge className={getRiskColor(analysisData.riskAssessment.overallRisk)}>
                {analysisData.riskAssessment.overallRisk.toUpperCase()}
              </Badge>
            </div>

            {/* High Risk Factors */}
            {highRiskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">High Risk Factors</h5>
                <ul className="space-y-1">
                  {highRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge className={getRiskColor('high')}>High</Badge>
                      <span>{factor.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Medium Risk Factors */}
            {mediumRiskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Medium Risk Factors</h5>
                <ul className="space-y-1">
                  {mediumRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge className={getRiskColor('medium')}>Medium</Badge>
                      <span>{factor.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Low Risk Factors */}
            {lowRiskFactors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Low Risk Factors</h5>
                <ul className="space-y-1">
                  {lowRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge className={getRiskColor('low')}>Low</Badge>
                      <span>{factor.description}</span>
                    </li>
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
          <ul className="space-y-1 text-sm">
            {analysisData.strategicRecommendations.map((recommendation, index) => (
              <li key={index}>• {recommendation}</li>
            ))}
          </ul>
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
            {analysisData.likelihoodOfSuccess.factors.length > 0 && (
              <div>
                <h5 className="text-xs font-medium mb-2">Supporting Factors</h5>
                <ul className="space-y-1 text-sm">
                  {analysisData.likelihoodOfSuccess.factors.map((factor, index) => (
                    <li key={index}>• {factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefinedAnalysisSection;