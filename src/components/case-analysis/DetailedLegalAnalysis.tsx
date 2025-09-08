import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Scale, FileText } from "lucide-react";
import RemediesSection from "./RemediesSection";
import IracAnalysisSection from "./IracAnalysisSection";
import { parseIracAnalysis } from "@/utils/iracParser";

interface DetailedLegalAnalysisProps {
  relevantLaw: string;
  preliminaryAnalysis: string;
  potentialIssues: string;
  followUpQuestions: string[];
  isLoading?: boolean;
  remedies?: string;
  caseType?: string;
  rawContent?: string;
  validationStatus?: string;
  caseSummary?: string;
  
}

const DetailedLegalAnalysis: React.FC<DetailedLegalAnalysisProps> = ({
  relevantLaw,
  preliminaryAnalysis,
  potentialIssues,
  followUpQuestions,
  isLoading = false,
  remedies,
  caseType,
  rawContent,
  validationStatus,
  caseSummary
}) => {

  // Parse IRAC analysis from raw content
  const iracAnalysis = useMemo(() => {
    if (!rawContent) return null;
    return parseIracAnalysis(rawContent);
  }, [rawContent]);


  // Extract case summary from prop first, then raw content
  const caseSummaryText = useMemo(() => {
    if (caseSummary && caseSummary.trim()) return caseSummary.trim();
    if (!rawContent) return iracAnalysis?.caseSummary || '';
    const bold = rawContent.match(/\*\*CASE SUMMARY:\*\*\s*([\s\S]*?)(?=\*\*[A-Z][A-Z\s\-]+:\*\*|$)/i);
    if (bold) return bold[1].trim();
    const plain = rawContent.match(/(?:^|\n)\s*CASE SUMMARY:\s*([\s\S]*?)(?=\n[A-Z][A-Z \-()&\/]+:\s*|$)/i);
    return plain ? plain[1].trim() : iracAnalysis?.caseSummary || '';
  }, [caseSummary, rawContent, iracAnalysis]);

  // Relevant Texas law comes directly from client intake props
  const relevantTexasLawText = useMemo(() => (relevantLaw || '').trim(), [relevantLaw]);


  return (
    <div className="space-y-6">

      {/* Case Summary */}
      {caseSummaryText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              {caseSummaryText.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relevant Texas Laws */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Relevant Texas Laws
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none text-sm">
            {(relevantTexasLawText ? relevantTexasLawText.split('\n\n') : ['No relevant law analysis available.']).map((paragraph, idx) => (
              <p key={idx} className="mb-2 last:mb-0 whitespace-pre-line">{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IRAC Analysis (if present) */}
      {iracAnalysis && (
        <IracAnalysisSection 
          analysis={iracAnalysis} 
          isLoading={isLoading}
          analysisData={{ rawContent }}
        />
      )}

      {/* Preliminary Analysis */}
      {preliminaryAnalysis && preliminaryAnalysis.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Preliminary Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              {preliminaryAnalysis.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0 whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Potential Legal Issues */}
      {potentialIssues && potentialIssues.trim() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Potential Legal Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              {potentialIssues.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0 whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Follow-up Questions */}
      {followUpQuestions && followUpQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Recommended Follow-up Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {followUpQuestions.map((question, idx) => (
                <li key={idx} className="text-muted-foreground">{question}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Remedies Section */}
      {remedies && (
        <RemediesSection remedies={remedies} caseType={caseType} />
      )}
    </div>
  );
};

export default DetailedLegalAnalysis;