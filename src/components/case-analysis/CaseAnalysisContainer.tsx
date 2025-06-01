
import React, { useState } from "react";
import { useCaseAnalysis } from "@/hooks/useCaseAnalysis";
import CaseAnalysisErrorState from "./CaseAnalysisErrorState";
import CaseAnalysisLoadingSkeleton from "./CaseAnalysisLoadingSkeleton";
import CaseAnalysisHeader from "./CaseAnalysisHeader";
import { useScholarlyReferences } from "@/hooks/useScholarlyReferences";
import { useCaseAnalysisChat } from "@/hooks/useCaseAnalysisChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import EmptyAnalysisState from "./EmptyAnalysisState";
import TabsContainer from "./tabs/TabsContainer";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { useCase } from "@/contexts/CaseContext";
import { useRealTimeAnalysis } from "@/hooks/useRealTimeAnalysis";

interface CaseAnalysisContainerProps {
  clientId: string;
  clientName: string;
  caseId?: string;
}

const CaseAnalysisContainer: React.FC<CaseAnalysisContainerProps> = ({
  clientId,
  clientName,
  caseId: propCaseId,
}) => {
  const [selectedTab, setSelectedTab] = useState("analysis");
  const { currentCase } = useCase();
  
  // Use caseId from props or from context
  const caseId = propCaseId || currentCase?.id;

  // Use real-time analysis instead of stored database analysis
  const { 
    analysisData, 
    isLoading, 
    error, 
    generateAnalysis 
  } = useRealTimeAnalysis(clientId, caseId);
    
  // Add scholarly references hook
  const {
    references: scholarlyReferences,
    isLoading: isScholarlyReferencesLoading,
    searchReferences
  } = useScholarlyReferences(clientId, analysisData?.caseType);
  
  // Get conversation and notes for the respective tabs
  const {
    conversation,
    notes, 
    loading: conversationLoading,
    isLoading: notesLoading
  } = useCaseAnalysisChat(clientId);

  // Client documents hook - still needed for the documents tab
  const {
    documents: clientDocuments,
    loading: documentsLoading,
    processDocument: processDocumentContent,
    isProcessing: isProcessingDocument
  } = useClientDocuments(clientId);

  // Create a wrapper function to adapt processDocumentContent to expect a File
  const processDocument = async (title: string, content: string, metadata: any = {}): Promise<any> => {
    try {
      return await processDocumentContent(title, content, metadata);
    } catch (error) {
      console.error("Error processing document content:", error);
    }
  };

  // Handle error state
  if (error) {
    return <CaseAnalysisErrorState error={error} onRefresh={generateAnalysis} />;
  }

  // Handle loading state
  if (isLoading && !analysisData) {
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
        isGenerating={isLoading}
        onGenerate={generateAnalysis}
      />
    );
  }
  
  // Ensure the analysisData has numeric values for defense and prosecution
  // and a valid timestamp
  const completeAnalysisData: AnalysisData = {
    ...analysisData,
    timestamp: analysisData.timestamp || new Date().toISOString(),
    outcome: {
      defense: typeof analysisData.outcome.defense === 'number' 
        ? analysisData.outcome.defense 
        : parseFloat(String(analysisData.outcome.defense)),
      prosecution: typeof analysisData.outcome.prosecution === 'number'
        ? analysisData.outcome.prosecution
        : parseFloat(String(analysisData.outcome.prosecution))
    }
  };
  
  // Handle the search for scholarly references
  const handleScholarSearch = (query: string) => {
    if (query) {
      searchReferences(query);
    }
  };

  const title = caseId && currentCase 
    ? `${clientName} - ${currentCase.case_title} Analysis`
    : `${clientName} - Case Analysis`;

  return (
    <div className="container mx-auto py-8">
      <CaseAnalysisHeader
        title={title}
        clientId={clientId}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isLoading}
        onGenerate={generateAnalysis}
        caseType={analysisData?.caseType}
      />

      {/* Main content area with tabs */}
      <TabsContainer 
        selectedTab={selectedTab}
        analysisData={completeAnalysisData}
        isLoading={isLoading}
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
