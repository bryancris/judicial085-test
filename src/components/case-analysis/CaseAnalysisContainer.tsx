
import React, { useState } from "react";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import CaseAnalysisErrorState from "./CaseAnalysisErrorState";
import CaseAnalysisLoadingSkeleton from "./CaseAnalysisLoadingSkeleton";
import DetailedLegalAnalysis from "./DetailedLegalAnalysis";
import CaseOutcomePrediction from "./CaseOutcomePrediction";
import CaseStrengthsWeaknesses from "./CaseStrengthsWeaknesses";
import ConversationSummary from "./ConversationSummary";
import ConversationList from "./conversation/ConversationList";
import AttorneyNotesList from "./conversation/AttorneyNotesList";
import SearchSimilarCasesSection from "./SearchSimilarCasesSection";
import CaseAnalysisHeader from "./CaseAnalysisHeader";
import LawReferencesSection from "./LawReferencesSection";
import { useScholarlyReferences } from "@/hooks/useScholarlyReferences";

interface CaseAnalysisContainerProps {
  clientId: string;
  clientName: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({
  clientId,
  clientName,
}) => {
  const [selectedTab, setSelectedTab] = useState("analysis");

  // Custom hooks for case analysis data
  const { analysisData, isLoading, error, generateNewAnalysis } =
    useCaseAnalysis(clientId);
    
  // Add scholarly references hook
  const {
    references: scholarlyReferences,
    isLoading: isScholarlyReferencesLoading,
    searchReferences
  } = useScholarlyReferences(clientId, analysisData?.caseType);

  if (error) {
    return <CaseAnalysisErrorState error={error} />;
  }

  if (isLoading && !analysisData) {
    return <CaseAnalysisLoadingSkeleton />;
  }

  // Handle case where there is no analysis data yet
  if (!analysisData) {
    return (
      <div className="container mx-auto py-8">
        <CaseAnalysisHeader
          title={`${clientName} - Case Analysis`}
          clientId={clientId}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isGenerating={isLoading}
          onGenerate={generateNewAnalysis}
        />

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">No Analysis Available</h2>
          <p className="text-gray-600 mb-6">
            There is no case analysis yet for this client. Generate one to get
            started.
          </p>
          <button
            onClick={generateNewAnalysis}
            disabled={isLoading}
            className="bg-brand-burgundy text-white px-4 py-2 rounded-md flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>Generate Analysis</>
            )}
          </button>
        </div>
      </div>
    );
  }
  
  // Handle the search for scholarly references
  const handleScholarSearch = (query: string) => {
    if (query) {
      searchReferences(query);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <CaseAnalysisHeader
        title={`${clientName} - Case Analysis`}
        clientId={clientId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isLoading}
        onGenerate={generateNewAnalysis}
        caseType={analysisData?.caseType}
      />

      {/* Main content area with conditional rendering based on selected tab */}
      {selectedTab === "analysis" && (
        <div className="space-y-8">
          {/* Law References Section */}
          {analysisData.lawReferences && analysisData.lawReferences.length > 0 && (
            <LawReferencesSection
              references={analysisData.lawReferences}
              isLoading={isLoading}
              caseType={analysisData.caseType}
            />
          )}

          {/* Case Overview and Outcome Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <ConversationSummary
                summary={analysisData.conversationSummary}
                isLoading={isLoading}
              />
            </div>
            <div className="md:col-span-1">
              <CaseOutcomePrediction
                defense={analysisData.outcome.defense}
                prosecution={analysisData.outcome.prosecution}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <CaseStrengthsWeaknesses
            strengths={analysisData.strengths}
            weaknesses={analysisData.weaknesses}
            isLoading={isLoading}
            caseType={analysisData.caseType}
          />

          {/* Similar Cases */}
          <SearchSimilarCasesSection clientId={clientId} caseType={analysisData.caseType} />

          {/* Detailed Legal Analysis */}
          <DetailedLegalAnalysis
            relevantLaw={analysisData.legalAnalysis.relevantLaw}
            preliminaryAnalysis={analysisData.legalAnalysis.preliminaryAnalysis}
            potentialIssues={analysisData.legalAnalysis.potentialIssues}
            followUpQuestions={analysisData.legalAnalysis.followUpQuestions}
            isLoading={isLoading}
            remedies={analysisData.remedies}
            caseType={analysisData.caseType}
            scholarlyReferences={scholarlyReferences}
            isScholarlyReferencesLoading={isScholarlyReferencesLoading}
            onScholarSearch={handleScholarSearch}
          />
        </div>
      )}

      {/* Conversation tab content */}
      {selectedTab === "conversation" && (
        <ConversationList clientId={clientId} />
      )}

      {/* Notes tab content */}
      {selectedTab === "notes" && <AttorneyNotesList clientId={clientId} />}
    </div>
  );
};

export default CaseAnalysisContainer;
