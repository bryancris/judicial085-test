
import React from "react";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import CaseOutcomePrediction from "./CaseOutcomePrediction";
import DetailedLegalAnalysis from "./DetailedLegalAnalysis";
import CaseStrengthsWeaknesses from "./CaseStrengthsWeaknesses";
import ConversationSummary from "./ConversationSummary";
import CaseAnalysisLoadingSkeleton from "./CaseAnalysisLoadingSkeleton";
import CaseAnalysisErrorState from "./CaseAnalysisErrorState";
import CaseAnalysisHeader from "./CaseAnalysisHeader";
import SearchSimilarCasesSection from "./SearchSimilarCasesSection";
import LawReferencesSection from "./LawReferencesSection";

interface CaseAnalysisContainerProps {
  clientId: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({ clientId }) => {
  const { analysisData, isLoading, error, generateNewAnalysis } = useCaseAnalysis(clientId);

  const handleRefreshAnalysis = () => {
    if (isLoading) return;
    generateNewAnalysis();
  };

  if (isLoading) {
    return <CaseAnalysisLoadingSkeleton />;
  }

  if (error && !analysisData) {
    return <CaseAnalysisErrorState error={error} onRefresh={handleRefreshAnalysis} />;
  }

  return (
    <div>
      <CaseAnalysisHeader 
        onRefresh={handleRefreshAnalysis} 
        isLoading={isLoading} 
        caseType={analysisData?.caseType}
      />

      {analysisData && (
        <>
          <CaseOutcomePrediction 
            defense={Number(analysisData.outcome.defense)} 
            prosecution={Number(analysisData.outcome.prosecution)}
            isLoading={isLoading}
            caseType={analysisData.caseType}
          />

          {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
            <LawReferencesSection 
              references={analysisData.lawReferences}
              isLoading={isLoading}
              caseType={analysisData.caseType}
            />
          )}

          <DetailedLegalAnalysis 
            relevantLaw={analysisData.legalAnalysis.relevantLaw}
            preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
            potentialIssues={analysisData.legalAnalysis.potentialIssues}
            followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
            remedies={analysisData.remedies}
            caseType={analysisData.caseType}
            isLoading={isLoading}
          />

          <CaseStrengthsWeaknesses 
            strengths={analysisData.strengths}
            weaknesses={analysisData.weaknesses}
            isLoading={isLoading}
            caseType={analysisData.caseType}
          />

          <SearchSimilarCasesSection 
            clientId={clientId} 
            caseType={analysisData.caseType}
          />

          <ConversationSummary 
            summary={analysisData.conversationSummary}
            isLoading={isLoading}
            clientId={clientId}
          />
        </>
      )}
    </div>
  );
};

export default CaseAnalysisContainer;
