
import React, { useState, useEffect } from "react";
import CaseAnalysisErrorState from "./CaseAnalysisErrorState";
import CaseAnalysisLoadingSkeleton from "./CaseAnalysisLoadingSkeleton";
import CaseAnalysisHeader from "./CaseAnalysisHeader";
import EmptyAnalysisState from "./EmptyAnalysisState";
import TabsContainer from "./tabs/TabsContainer";
import { useCase } from "@/contexts/CaseContext";
import { useAnalysisGeneration } from "@/hooks/useAnalysisGeneration";
import { useCaseAnalysisData } from "./hooks/useCaseAnalysisData";

interface CaseAnalysisContainerProps {
  clientId: string;
  clientName: string;
  caseId?: string;
  refreshTrigger?: number;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({
  clientId,
  clientName,
  caseId: propCaseId,
  refreshTrigger,
}) => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const { currentCase } = useCase();
  
  // Use caseId from props or from context
  const caseId = propCaseId || currentCase?.id;

  console.log("CaseAnalysisContainer: Rendering with", { clientId, caseId, refreshTrigger });

  // Get all analysis-related data and handlers
  const {
    analysisData,
    isAnalysisLoading,
    analysisError,
    hasUnincorporatedFindings,
    fetchAnalysisData,
    scholarlyReferences,
    isScholarlyReferencesLoading,
    handleScholarSearch,
    fetchScholarlyReferences,
    similarCases,
    isSimilarCasesLoading,
    analysisFound,
    fallbackUsed,
    fetchSimilarCases,
    conversation,
    notes,
    conversationLoading,
    notesLoading,
    clientDocuments,
    documentsLoading,
    processDocument,
    isProcessingDocument,
    currentAnalysisId
  } = useCaseAnalysisData(clientId, caseId);

  // Get analysis generation functionality
  const { isGeneratingAnalysis, generateRealTimeAnalysis } = useAnalysisGeneration(clientId, caseId);

  // Refresh analysis when trigger changes (from Case Discussion)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("CaseAnalysisContainer: Refreshing analysis due to external trigger:", refreshTrigger);
      fetchAnalysisData();
    }
  }, [refreshTrigger, fetchAnalysisData]);

  // UPDATED: Wrapper to pass fetchAnalysisData, fetchSimilarCases, and fetchScholarlyReferences to generation function
  const handleGenerateAnalysis = async () => {
    console.log("CaseAnalysisContainer: Starting analysis generation...");
    try {
      await generateRealTimeAnalysis(
        async () => {
          console.log("CaseAnalysisContainer: Analysis complete - refreshing data");
          await fetchAnalysisData();
        },
        fetchSimilarCases, // This will now automatically save to database
        fetchScholarlyReferences // This will now automatically save to database
      );
      console.log("CaseAnalysisContainer: Analysis generation completed");
    } catch (error) {
      console.error("CaseAnalysisContainer: Analysis generation failed:", error);
    }
  };

  // Handle error state
  if (analysisError) {
    console.log("CaseAnalysisContainer: Showing error state:", analysisError);
    return <CaseAnalysisErrorState error={analysisError} onRefresh={fetchAnalysisData} />;
  }

  // Handle loading state
  if (isAnalysisLoading && !analysisData) {
    console.log("CaseAnalysisContainer: Showing loading skeleton");
    return <CaseAnalysisLoadingSkeleton />;
  }

  // Handle case where there is no analysis data yet
  if (!analysisData) {
    console.log("CaseAnalysisContainer: No analysis data - showing empty state");
    return (
      <EmptyAnalysisState 
        clientName={clientName}
        clientId={clientId}
        caseId={caseId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isGeneratingAnalysis}
        onGenerate={handleGenerateAnalysis}
      />
    );
  }

  const title = caseId && currentCase 
    ? `${clientName} - ${currentCase.case_title} Analysis`
    : `${clientName} - Case Analysis`;

  // Combine loading states for proper button feedback
  const isCombinedLoading = isAnalysisLoading || isGeneratingAnalysis;

  console.log("CaseAnalysisContainer: Rendering main content with analysis data");

  return (
    <div className="container mx-auto py-8">
      <CaseAnalysisHeader
        title={title}
        clientId={clientId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isCombinedLoading}
        onGenerate={handleGenerateAnalysis}
        caseType={analysisData?.caseType}
        hasUnincorporatedFindings={hasUnincorporatedFindings}
      />

      {/* Main content area with tabs */}
      <TabsContainer 
        selectedTab={selectedTab}
        analysisData={analysisData}
        isLoading={isCombinedLoading}
        clientId={clientId}
        caseId={caseId}
        currentAnalysisId={currentAnalysisId}
        conversation={conversation}
        conversationLoading={conversationLoading}
        notes={notes}
        notesLoading={notesLoading}
        scholarlyReferences={scholarlyReferences}
        isScholarlyReferencesLoading={isScholarlyReferencesLoading}
        onScholarSearch={handleScholarSearch}
        onScholarRefresh={fetchScholarlyReferences}
        similarCases={similarCases}
        isSimilarCasesLoading={isSimilarCasesLoading}
        analysisFound={analysisFound}
        fallbackUsed={fallbackUsed}
      />
    </div>
  );
};

export default CaseAnalysisContainer;
