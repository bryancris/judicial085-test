
import React from "react";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import DetailedLegalAnalysis from "../DetailedLegalAnalysis";
import CaseStrengthsWeaknesses from "../CaseStrengthsWeaknesses";
import SearchSimilarCasesSection from "../SearchSimilarCasesSection";
import LawReferencesSection from "../LawReferencesSection";
import ScholarlyReferencesSection from "../ScholarlyReferencesSection";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { AnalysisData } from "@/hooks/useAnalysisData";

interface AnalysisTabContentProps {
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
  scholarlyReferences: ScholarlyArticle[];
  isScholarlyReferencesLoading: boolean;
  onScholarSearch: (query: string) => void;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  analysisData,
  isLoading,
  clientId,
  scholarlyReferences,
  isScholarlyReferencesLoading,
  onScholarSearch
}) => {
  return (
    <div className="space-y-8">
      {/* Detailed Legal Analysis - now using raw content like Client Intake */}
      <DetailedLegalAnalysis
        relevantLaw={analysisData.legalAnalysis.relevantLaw}
        preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
        potentialIssues={analysisData.legalAnalysis.potentialIssues}
        followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
        isLoading={isLoading}
        remedies={analysisData.remedies}
        caseType={analysisData.caseType}
        rawContent={analysisData.rawContent}
      />

      {/* Law References Section */}
      {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
        <LawReferencesSection
          references={analysisData.lawReferences}
          isLoading={isLoading}
          caseType={analysisData.caseType}
        />
      )}

      {/* Strengths and Weaknesses */}
      <CaseStrengthsWeaknesses
        strengths={analysisData.strengths}
        weaknesses={analysisData.weaknesses}
        isLoading={isLoading}
        caseType={analysisData.caseType}
      />

      {/* Similar Cases with integrated Outcome Prediction */}
      <SearchSimilarCasesSection clientId={clientId} caseType={analysisData.caseType} />

      {/* Scholarly Legal References - ONLY HERE AT THE BOTTOM */}
      <ScholarlyReferencesSection
        references={scholarlyReferences}
        isLoading={isScholarlyReferencesLoading}
        caseType={analysisData.caseType}
        onSearch={onScholarSearch}
      />
    </div>
  );
};

export default AnalysisTabContent;
