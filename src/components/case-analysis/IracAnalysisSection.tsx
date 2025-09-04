import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, Scale, BookOpen } from "lucide-react";
import { IracIssue, IracAnalysis } from "@/types/caseAnalysis";
import { useCitationProcessor } from "@/hooks/useCitationProcessor";
import { EnhancedText } from "@/components/ui/EnhancedText";

interface IracAnalysisSectionProps {
  analysis: IracAnalysis;
  isLoading?: boolean;
}

interface IracIssueCardProps {
  issue: IracIssue;
  index: number;
}

const IracIssueCard: React.FC<IracIssueCardProps> = ({ issue, index }) => {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First issue expanded by default
  const { processText, citationMatches, enhancedCitations } = useCitationProcessor();

  useEffect(() => {
    if (isExpanded) {
      // Process citations in rule, application, and conclusion only when expanded
      const allText = `${issue.rule} ${issue.application} ${issue.conclusion}`;
      if (allText.trim()) {
        processText(allText);
      }
    }
  }, [isExpanded, issue.rule, issue.application, issue.conclusion, processText]);

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              Issue {index + 1}
            </Badge>
            {issue.category && (
              <Badge variant="secondary" className="text-xs">
                {issue.category}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardTitle className="text-sm font-medium leading-relaxed">
          <strong>Issue:</strong> {issue.issueStatement}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-primary">
              <BookOpen className="h-4 w-4" />
              Rule
            </h4>
            <div className="prose dark:prose-invert text-sm max-w-none">
              {issue.rule.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">
                  <EnhancedText 
                    text={paragraph}
                    citationMatches={citationMatches.filter(match => 
                      paragraph.includes(match.citation)
                    )}
                    enhancedCitations={enhancedCitations}
                  />
                </p>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="flex items-center gap-2 font-semibold text-sm mb-2 text-primary">
              <Scale className="h-4 w-4" />
              Application
            </h4>
            <div className="prose dark:prose-invert text-sm max-w-none">
              {issue.application.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">
                  <EnhancedText 
                    text={paragraph}
                    citationMatches={citationMatches.filter(match => 
                      paragraph.includes(match.citation)
                    )}
                    enhancedCitations={enhancedCitations}
                  />
                </p>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">
              Conclusion
            </h4>
            <div className="prose dark:prose-invert text-sm max-w-none">
              {issue.conclusion.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">
                  <EnhancedText 
                    text={paragraph}
                    citationMatches={citationMatches.filter(match => 
                      paragraph.includes(match.citation)
                    )}
                    enhancedCitations={enhancedCitations}
                  />
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const IracAnalysisSection: React.FC<IracAnalysisSectionProps> = ({
  analysis,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            IRAC Legal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          IRAC Legal Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Issue • Rule • Application • Conclusion methodology for structured legal analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Case Summary */}
        <div>
          <h3 className="font-semibold text-base mb-3">Case Summary</h3>
          <div className="prose dark:prose-invert text-sm max-w-none">
            {analysis.caseSummary.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </div>

        <Separator />

        {/* IRAC Issues */}
        <div>
          <h3 className="font-semibold text-base mb-4">Legal Issues Analysis</h3>
          <div className="space-y-4">
            {analysis.legalIssues.map((issue, index) => (
              <IracIssueCard key={issue.id} issue={issue} index={index} />
            ))}
          </div>
        </div>

        {/* Overall Conclusion */}
        {analysis.overallConclusion && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-base mb-3">Overall Conclusion</h3>
              <div className="prose dark:prose-invert text-sm max-w-none">
                {analysis.overallConclusion.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Follow-up Questions */}
        {analysis.followUpQuestions.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-base mb-3">Recommended Follow-up Questions</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {analysis.followUpQuestions.map((question, idx) => (
                  <li key={idx} className="text-muted-foreground">{question}</li>
                ))}
              </ol>
            </div>
          </>
        )}

        {/* Next Steps */}
        {analysis.nextSteps.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-base mb-3">Next Steps</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-muted-foreground">{step}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IracAnalysisSection;