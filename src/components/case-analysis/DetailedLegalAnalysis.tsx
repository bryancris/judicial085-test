import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, Scale, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AnalysisItem from "@/components/clients/chat/AnalysisItem";
import RemediesSection from "./RemediesSection";
import IracAnalysisSection from "./IracAnalysisSection";
import { parseIracAnalysis, isIracStructured } from "@/utils/iracParser";

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
  viewMode?: 'irac' | 'traditional';
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
  viewMode = 'irac'
}) => {

  // Parse IRAC analysis from raw content
  const iracAnalysis = useMemo(() => {
    if (!rawContent) return null;
    return parseIracAnalysis(rawContent);
  }, [rawContent]);

  // Determine if content supports IRAC structure
  const supportsIrac = useMemo(() => {
    return rawContent ? isIracStructured(rawContent) : false;
  }, [rawContent]);

  // Extract case summary from raw content
  const caseSummaryText = useMemo(() => {
    if (!rawContent) return iracAnalysis?.caseSummary || '';
    const match = rawContent.match(/\*\*CASE SUMMARY:\*\*\s*([\s\S]*?)(?=\*\*[A-Z][A-Z\s\-]+:\*\*|$)/i);
    return match ? match[1].trim() : iracAnalysis?.caseSummary || '';
  }, [rawContent, iracAnalysis]);

  // Extract relevant Texas law from raw content
  const relevantTexasLawText = useMemo(() => {
    if (!rawContent) return '';
    const match = rawContent.match(/\*\*RELEVANT TEXAS LAW\w*:\*\*\s*([\s\S]*?)(?=\*\*[A-Z][A-Z\s\-]+:\*\*|$)/i);
    return match ? match[1].trim() : '';
  }, [rawContent]);

  // Default to traditional view if IRAC is not supported
  const effectiveViewMode = supportsIrac ? viewMode : 'traditional';

  return (
    <div className="space-y-6">

      {/* Case Summary - Above IRAC Analysis */}
      {effectiveViewMode === 'irac' && caseSummaryText && (
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

      {/* Relevant Texas Laws - Above IRAC Analysis */}
      {effectiveViewMode === 'irac' && relevantTexasLawText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Relevant Texas Laws
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              {relevantTexasLawText.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IRAC Analysis View */}
      {effectiveViewMode === 'irac' && iracAnalysis && (
        <IracAnalysisSection 
          analysis={iracAnalysis} 
          isLoading={isLoading}
          analysisData={{ rawContent }}
        />
      )}

      {/* Traditional Analysis View */}
      {effectiveViewMode === 'traditional' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Detailed Legal Analysis
              {validationStatus && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  validationStatus === 'validated' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : validationStatus === 'pending_review'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {validationStatus.replace('_', ' ')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rawContent ? (
              <div className="prose dark:prose-invert max-w-none">
                {rawContent.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 leading-relaxed">{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Relevant Texas Law</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <p>{relevantLaw}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Preliminary Analysis</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <p>{preliminaryAnalysis}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Potential Legal Issues</h3>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <p>{potentialIssues}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recommended Follow-up Questions</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {followUpQuestions.map((question, idx) => (
                      <li key={idx} className="text-muted-foreground">{question}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
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