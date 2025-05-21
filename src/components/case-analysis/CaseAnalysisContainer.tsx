
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
  
  // Get conversation and notes for the respective tabs
  const {
    conversation,
    notes, 
    loading: conversationLoading,
    isLoading: notesLoading
  } = useCaseAnalysisChat(clientId);

  // Client documents hook
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
    return <CaseAnalysisErrorState error={error} onRefresh={generateNewAnalysis} />;
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
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        isGenerating={isLoading}
        onGenerate={generateNewAnalysis}
      />
    );
  }
  
  // Ensure the analysisData has numeric values for defense and prosecution
  const completeAnalysisData = {
    ...analysisData,
    timestamp: analysisData.timestamp || new Date().toISOString(),
    outcome: {
      defense: typeof analysisData.outcome.defense === 'string' 
        ? parseFloat(analysisData.outcome.defense) 
        : analysisData.outcome.defense,
      prosecution: typeof analysisData.outcome.prosecution === 'string' 
        ? parseFloat(analysisData.outcome.prosecution) 
        : analysisData.outcome.prosecution
    }
  };
  
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
