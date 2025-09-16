
import React, { useMemo } from "react";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import CaseSummarySection from "../steps/CaseSummarySection";
import PreliminaryAnalysisSection from "../steps/PreliminaryAnalysisSection";
import RelevantTexasLawsSection from "../steps/RelevantTexasLawsSection";
import AdditionalCaseLawSectionWithPersistence from "../steps/AdditionalCaseLawSectionWithPersistence";
import IracAnalysisSection from "../IracAnalysisSection";
import LegalIssuesAssessmentSection from "../steps/LegalIssuesAssessmentSection";
import CaseStrengthsWeaknesses from "../CaseStrengthsWeaknesses";
import RefinedAnalysisSection from "../steps/RefinedAnalysisSection";
import FollowUpQuestionsSection from "../steps/FollowUpQuestionsSection";
import LawReferencesSection from "../LawReferencesSection";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { parseIracAnalysis, isIracStructured } from "@/utils/iracParser";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AnalysisTabContentProps {
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
  regenerateStep7?: () => void;
  regenerateStep8?: () => void;
  isRegeneratingStep7?: boolean;
  isRegeneratingStep8?: boolean;
  generateNewAnalysis?: () => void;
  isAnalysisLoading?: boolean;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  analysisData,
  isLoading,
  clientId,
  regenerateStep7,
  regenerateStep8,
  isRegeneratingStep7,
  isRegeneratingStep8,
  generateNewAnalysis,
  isAnalysisLoading,
}) => {
  // Parse IRAC analysis - prefer dedicated iracContent, fallback to raw content
  const iracAnalysis = useMemo(() => {
    // First try dedicated IRAC content
    if (analysisData.iracContent) {
      console.log("🧮 Using dedicated IRAC content for Step 5");
      if (isIracStructured(analysisData.iracContent)) {
        return parseIracAnalysis(analysisData.iracContent);
      }
    }
    
    // Fallback to raw content parsing (legacy)
    const raw = analysisData.rawContent || "";
    if (!raw) return null;
    // Only parse if IRAC structure is clearly present and not a preliminary-only output
    if (!isIracStructured(raw)) return null;
    if (/\*\*PRELIMINARY ANALYSIS:\*\*/i.test(raw)) return null;
    console.log("🔄 Using legacy IRAC parsing from raw content");
    return parseIracAnalysis(raw);
  }, [analysisData.rawContent, analysisData.iracContent]);

  return (
    <div className="space-y-8">
      {/* Refresh Analysis Button */}
      {generateNewAnalysis && (
        <div className="flex justify-center">
          <Button
            onClick={generateNewAnalysis}
            disabled={isAnalysisLoading || isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalysisLoading ? 'animate-spin' : ''}`} />
            {isAnalysisLoading ? "Generating..." : "Refresh Analysis"}
          </Button>
        </div>
      )}
      
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
      <AdditionalCaseLawSectionWithPersistence
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

      {/* Step 6: Case Strengths & Weaknesses (Combined risk assessment + strengths) */}
      <CaseStrengthsWeaknesses
        strengths={analysisData.strengths}
        weaknesses={analysisData.weaknesses}
        isLoading={isLoading}
        caseType={analysisData.caseType}
      />

      {/* Step 7: Refined Analysis (Comprehensive synthesis + Risk Assessment) */}
      <RefinedAnalysisSection
        analysisData={analysisData.refinedAnalysis}
        refinedAnalysisRaw={analysisData.refinedAnalysisRaw}
        isLoading={isLoading}
        onRegenerateStep7={regenerateStep7}
        isRegenerating={isRegeneratingStep7}
      />

      {/* Step 8: Recommended Follow-up Questions */}
      <FollowUpQuestionsSection
        questionsData={null} // TODO: Parse structured data from followUpQuestionsRaw when available
        followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
        followUpQuestionsRaw={analysisData.followUpQuestionsRaw}
        isLoading={isLoading}
        onRegenerateStep8={regenerateStep8}
        isRegenerating={isRegeneratingStep8}
      />

      {/* Step 9: Relevant Texas Law References (Vectorized Legal Documents) */}
      <LawReferencesSection
        references={analysisData.lawReferences || []}
        isLoading={isLoading}
        caseType={analysisData.caseType}
      />

    </div>
  );
};

export default AnalysisTabContent;
