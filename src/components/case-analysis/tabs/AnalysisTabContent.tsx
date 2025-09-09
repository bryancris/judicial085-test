
import React from "react";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import CaseSummarySection from "../steps/CaseSummarySection";
import PreliminaryAnalysisSection from "../steps/PreliminaryAnalysisSection";
import RelevantTexasLawsSection from "../steps/RelevantTexasLawsSection";
import AdditionalCaseLawSection from "../steps/AdditionalCaseLawSection";
import IracAnalysisSection from "../IracAnalysisSection";
import LegalIssuesAssessmentSection from "../steps/LegalIssuesAssessmentSection";
import CaseStrengthsWeaknesses from "../CaseStrengthsWeaknesses";
import RefinedAnalysisSection from "../steps/RefinedAnalysisSection";
import FollowUpQuestionsSection from "../steps/FollowUpQuestionsSection";
import LawReferencesSection from "../LawReferencesSection";
import SimilarCasesSection, { SimilarCase } from "../SimilarCasesSection";
import ScholarlyReferencesSection from "../ScholarlyReferencesSection";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { parseIracAnalysis } from "@/utils/iracParser";

interface AnalysisTabContentProps {
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
  scholarlyReferences: ScholarlyArticle[];
  isScholarlyReferencesLoading: boolean;
  onScholarSearch: (query: string) => void;
  onScholarRefresh?: () => void;
  similarCases: SimilarCase[];
  isSimilarCasesLoading: boolean;
  analysisFound: boolean;
  fallbackUsed: boolean;
  onSimilarCasesRefresh?: () => void;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  analysisData,
  isLoading,
  clientId,
  scholarlyReferences,
  isScholarlyReferencesLoading,
  onScholarSearch,
  onScholarRefresh,
  similarCases,
  isSimilarCasesLoading,
  analysisFound,
  fallbackUsed,
  onSimilarCasesRefresh,
}) => {
  // Parse IRAC analysis from raw content
  const iracAnalysis = analysisData.rawContent ? parseIracAnalysis(analysisData.rawContent) : null;

  return (
    <div className="space-y-8">
      {/* 9-Step Sequential Workflow */}
      
      {/* Step 1: Case Summary (Organized Fact Pattern) */}
      <CaseSummarySection
        caseSummary={analysisData.conversationSummary}
        isLoading={isLoading}
      />

      {/* Step 2: Preliminary Analysis (AI-assisted broad issue spotting) */}
      <PreliminaryAnalysisSection
        preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
        isLoading={isLoading}
      />

      {/* Step 3: Relevant Texas Laws (Targeted legal research) */}
      <RelevantTexasLawsSection
        relevantLaw={analysisData.legalAnalysis.relevantLaw}
        isLoading={isLoading}
      />

      {/* Step 4: Additional Case Law (Precedent research) */}
      <AdditionalCaseLawSection
        caseLaw={[]} // TODO: Extract from analysis data when available
        isLoading={isLoading}
      />

      {/* Step 5: IRAC Legal Analysis (Comprehensive deep analysis) */}
      {iracAnalysis && (
        <IracAnalysisSection 
          analysis={iracAnalysis} 
          isLoading={isLoading}
          analysisData={{ rawContent: analysisData.rawContent }}
        />
      )}

      {/* Step 6: Legal Issues Assessment (Issues validated through analysis) */}
      <LegalIssuesAssessmentSection
        issues={[]} // TODO: Extract from analysis data when available
        isLoading={isLoading}
      />

      {/* Step 7: Case Strengths & Weaknesses */}
      <CaseStrengthsWeaknesses
        strengths={analysisData.strengths}
        weaknesses={analysisData.weaknesses}
        isLoading={isLoading}
        caseType={analysisData.caseType}
      />

      {/* Step 8: Refined Analysis (Comprehensive synthesis + Risk Assessment) */}
      <RefinedAnalysisSection
        analysisData={null} // TODO: Extract from analysis data when available
        isLoading={isLoading}
      />

      {/* Step 9: Recommended Follow-up Questions */}
      <FollowUpQuestionsSection
        questionsData={null} // TODO: Extract from analysis data when available
        followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
        isLoading={isLoading}
      />

      {/* Additional Reference Sections */}
      
      {/* Law References Section */}
      {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
        <LawReferencesSection
          references={analysisData.lawReferences}
          isLoading={isLoading}
          caseType={analysisData.caseType}
        />
      )}

      {/* Similar Cases with integrated Outcome Prediction */}
      <SimilarCasesSection
        similarCases={similarCases}
        isLoading={isSimilarCasesLoading}
        caseType={analysisData.caseType}
        analysisFound={analysisFound}
        fallbackUsed={fallbackUsed}
        clientId={clientId}
        legalAnalysisId={analysisData.id}
        onCasesFound={onSimilarCasesRefresh}
      />

      {/* Scholarly Legal References */}
      <ScholarlyReferencesSection
        references={scholarlyReferences}
        isLoading={isScholarlyReferencesLoading}
        caseType={analysisData.caseType}
        onSearch={onScholarSearch}
        onRefresh={onScholarRefresh}
      />
    </div>
  );
};

export default AnalysisTabContent;
