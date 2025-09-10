
import React, { useMemo } from "react";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import CaseSummarySection from "../steps/CaseSummarySection";
import PreliminaryAnalysisSection from "../steps/PreliminaryAnalysisSection";
import RelevantTexasLawsSection from "../steps/RelevantTexasLawsSection";
import { AdditionalCaseLawSection } from "../AdditionalCaseLawSection";
import IracAnalysisSection from "../IracAnalysisSection";
import LegalIssuesAssessmentSection from "../steps/LegalIssuesAssessmentSection";
import CaseStrengthsWeaknesses from "../CaseStrengthsWeaknesses";
import RefinedAnalysisSection from "../steps/RefinedAnalysisSection";
import FollowUpQuestionsSection from "../steps/FollowUpQuestionsSection";
import LawReferencesSection from "../LawReferencesSection";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { parseIracAnalysis, isIracStructured } from "@/utils/iracParser";

interface AnalysisTabContentProps {
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  analysisData,
  isLoading,
  clientId,
}) => {
  // Parse IRAC analysis from raw content with safeguards (only when truly IRAC)
  const iracAnalysis = useMemo(() => {
    const raw = analysisData.rawContent || "";
    if (!raw) return null;
    // Only parse if IRAC structure is clearly present and not a preliminary-only output
    if (!isIracStructured(raw)) return null;
    if (/\*\*PRELIMINARY ANALYSIS:\*\*/i.test(raw)) return null;
    return parseIracAnalysis(raw);
  }, [analysisData.rawContent]);

  return (
    <div className="space-y-8">
      {/* 9-Step Sequential Workflow */}
      
      {/* Step 1: Case Summary (Organized Fact Pattern) */}
      <CaseSummarySection
        caseSummary={analysisData.conversationSummary}
        isLoading={isLoading}
        clientId={clientId}
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
        analysisData={analysisData}
        clientId={clientId}
        caseType={analysisData.caseType}
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

    </div>
  );
};

export default AnalysisTabContent;
