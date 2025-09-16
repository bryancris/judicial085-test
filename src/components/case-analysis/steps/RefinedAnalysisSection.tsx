import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RefinedAnalysisData } from "@/utils/refinedAnalysisParser";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { parseRefinedAnalysisContent, parseStrongText, ContentSection } from "@/utils/refinedAnalysisContentParser";

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
  const parsedContent = useMemo(() => {
    // Prioritize raw refined analysis content if available
    const content = refinedAnalysisRaw || analysisData?.executiveSummary || "";
    if (!content) return { sections: [] };
    
    return parseRefinedAnalysisContent(content);
  }, [refinedAnalysisRaw, analysisData?.executiveSummary]);

  console.log('🔍 RefinedAnalysisSection state:', {
    hasAnalysisData: !!analysisData,
    hasRefinedAnalysisRaw: !!refinedAnalysisRaw,
    refinedAnalysisRawLength: refinedAnalysisRaw?.length || 0,
    parsedSections: parsedContent.sections.length,
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
        <CardTitle className="step-card-title">
          <CheckCircle className="h-5 w-5" />
          <span className="step-number">Step 7:</span>
          Legal Requirements Verification & Case Conclusion
        </CardTitle>
        </CardHeader>
        <CardContent className="step-content-unified">
          <div className="step-legal-text">
            {renderParsedContent(parsedContent.sections)}
          </div>
          {onRegenerateStep7 && (
            <div className="step-regen-section">
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
        <CardTitle className="step-card-title">
          <CheckCircle className="h-5 w-5" />
          <span className="step-number">Step 7:</span>
          Legal Requirements Verification & Case Conclusion
        </CardTitle>
        </CardHeader>
        <CardContent className="step-content-unified">
          <p className="text-foreground text-sm">No refined analysis available.</p>
          {onRegenerateStep7 && (
            <Button 
              onClick={onRegenerateStep7} 
              variant="outline" 
              size="sm"
              className="text-xs mt-4"
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
        <CardTitle className="step-card-title">
          <CheckCircle className="h-5 w-5" />
          <span className="step-number">Step 7:</span>
          Legal Requirements Verification & Case Conclusion
        </CardTitle>
        </CardHeader>
      <CardContent className="step-content-unified">
        {/* Executive Summary */}
        <div className="step-section">
          <h4 className="step-section-header">
            <CheckCircle className="h-4 w-4" />
            Executive Summary
          </h4>
          <div className="step-legal-text">
            {renderParsedContent(parsedContent.sections)}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="step-section">
          <h4 className="step-section-header">
            <AlertTriangle className="h-4 w-4" />
            Risk Assessment
          </h4>
          <div className="space-y-3">
            {/* Overall Risk Level */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Overall Risk:</span>
              <Badge className={getRiskColor(analysisData.riskAssessment.overallRisk)}>
                {analysisData.riskAssessment.overallRisk.toUpperCase()}
              </Badge>
            </div>

            {/* High Risk Factors */}
            {highRiskFactors.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">High Risk Factors</h5>
                <ul className="space-y-1">
                  {highRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground">
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
                <h5 className="text-sm font-medium mb-2 text-foreground">Medium Risk Factors</h5>
                <ul className="space-y-1">
                  {mediumRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground">
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
                <h5 className="text-sm font-medium mb-2 text-foreground">Low Risk Factors</h5>
                <ul className="space-y-1">
                  {lowRiskFactors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground">
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
        <div className="step-section">
          <h4 className="step-section-header">
            <Target className="h-4 w-4" />
            Strategic Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-foreground">
            {analysisData.strategicRecommendations.map((recommendation, index) => (
              <li key={index}>• {recommendation}</li>
            ))}
          </ul>
        </div>

        {/* Likelihood of Success */}
        <div className="step-section">
          <h4 className="step-section-header">Likelihood of Success</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getSuccessColor(analysisData.likelihoodOfSuccess.percentage)}`}>
                {analysisData.likelihoodOfSuccess.percentage}%
              </span>
            </div>
            {analysisData.likelihoodOfSuccess.factors.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 text-foreground">Supporting Factors</h5>
                <ul className="space-y-1 text-sm text-foreground">
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

/**
 * Render parsed content sections as React components with explicit Tailwind classes
 */
const renderParsedContent = (sections: ContentSection[]) => {
  return sections.map((section, index) => {
    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(section.level || 1, 6)}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-sm font-semibold text-foreground mb-2',
          2: 'text-xs font-semibold text-foreground mb-2',
          3: 'text-xs font-medium text-foreground mb-1',
          4: 'text-xs font-medium text-muted-foreground mb-1',
          5: 'text-xs font-normal text-muted-foreground mb-1',
          6: 'text-xs font-normal text-muted-foreground mb-1'
        };
        
        return React.createElement(
          HeadingTag,
          { 
            key: index, 
            className: headingClasses[section.level as keyof typeof headingClasses] || headingClasses[3]
          },
          renderTextWithEmphasis(section.content)
        );

      case 'paragraph':
        return (
          <p key={index} className="text-xs font-normal text-foreground leading-relaxed">
            {renderTextWithEmphasis(section.content)}
          </p>
        );

      case 'list':
        return (
          <ul key={index} className="space-y-1 ml-4">
            {section.items?.map((item, itemIndex) => (
              <li key={itemIndex} className="text-xs font-normal text-foreground leading-relaxed flex items-start gap-2">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                {renderTextWithEmphasis(item)}
              </li>
            ))}
          </ul>
        );

      case 'text':
        return (
          <div key={index} className="text-xs font-normal text-foreground">
            {renderTextWithEmphasis(section.content)}
          </div>
        );

      default:
        return null;
    }
  });
};

/**
 * Render text with proper emphasis using explicit font classes
 */
const renderTextWithEmphasis = (text: string) => {
  const parts = parseStrongText(text);
  
  return parts.map((part, index) => (
    <span 
      key={index} 
      className={part.strong ? 'font-semibold' : 'font-normal'}
    >
      {part.text}
    </span>
  ));
};

export default RefinedAnalysisSection;