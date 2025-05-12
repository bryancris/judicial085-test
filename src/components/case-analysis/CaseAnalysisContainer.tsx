
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
      <CaseAnalysisHeader onRefresh={handleRefreshAnalysis} isLoading={isLoading} />

      {analysisData && (
        <>
          <CaseOutcomePrediction 
            defense={analysisData.outcome.defense} 
            prosecution={analysisData.outcome.prosecution}
            isLoading={isLoading}
          />

          {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
            <LawReferencesSection 
              references={analysisData.lawReferences}
              isLoading={isLoading}
            />
          )}

          <DetailedLegalAnalysis 
            relevantLaw={analysisData.legalAnalysis.relevantLaw}
            preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
            potentialIssues={analysisData.legalAnalysis.potentialIssues}
            followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
            isLoading={isLoading}
          />

          <CaseStrengthsWeaknesses 
            strengths={analysisData.strengths}
            weaknesses={analysisData.weaknesses}
            isLoading={isLoading}
          />

          <SearchSimilarCasesSection clientId={clientId} />

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
