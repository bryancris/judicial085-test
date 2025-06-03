
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
    conversation,
    notes,
    conversationLoading,
    notesLoading,
    clientDocuments,
    documentsLoading,
    processDocument,
    isProcessingDocument
  } = useCaseAnalysisData(clientId, caseId);

  // Get analysis generation functionality
  const { isGeneratingAnalysis, generateRealTimeAnalysis } = useAnalysisGeneration(clientId, caseId);

  // Refresh analysis when trigger changes (from Case Discussion)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("Refreshing analysis due to external trigger:", refreshTrigger);
      fetchAnalysisData();
    }
  }, [refreshTrigger, fetchAnalysisData]);

  // Wrapper to pass fetchAnalysisData to generation function
  const handleGenerateAnalysis = () => {
    generateRealTimeAnalysis(fetchAnalysisData);
  };

  // Handle error state
  if (analysisError) {
    return <CaseAnalysisErrorState error={analysisError} onRefresh={fetchAnalysisData} />;
  }

  // Handle loading state
  if (isAnalysisLoading && !analysisData) {
    return <CaseAnalysisLoadingSkeleton />;
  }

  // Handle case where there is no analysis data yet
  if (!analysisData) {
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
        conversation={conversation}
        conversationLoading={conversationLoading}
        notes={notes}
        notesLoading={notesLoading}
        clientDocuments={clientDocuments}
        documentsLoading={documentsLoading}
        processDocument={processDocument}
        isProcessingDocument={isProcessingDocument}
        scholarlyReferences={scholarlyReferences}
        isScholarlyReferencesLoading={isScholarlyReferencesLoading}
        onScholarSearch={handleScholarSearch}
      />
    </div>
  );
};

export default CaseAnalysisContainer;
