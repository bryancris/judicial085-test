
import React from "react";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";
import ClientDocumentsSection from "../documents/ClientDocumentsSection";
import AnalysisTabContent from "./AnalysisTabContent";
import { CaseAnalysisData, ProcessDocumentFileFunction } from "@/types/caseAnalysis";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";

interface TabsContainerProps {
  selectedTab: string;
  analysisData: CaseAnalysisData;
  isLoading: boolean;
  clientId: string;
  conversation: any[];
  conversationLoading: boolean;
  notes: any[];
  notesLoading: boolean;
  clientDocuments: any[];
  documentsLoading: boolean;
  processDocument: ProcessDocumentFileFunction;
  isProcessingDocument: boolean;
  scholarlyReferences: ScholarlyArticle[];
  isScholarlyReferencesLoading: boolean;
  onScholarSearch: (query: string) => void;
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  selectedTab,
  analysisData,
  isLoading,
  clientId,
  conversation,
  conversationLoading,
  notes,
  notesLoading,
  clientDocuments,
  documentsLoading,
  processDocument,
  isProcessingDocument,
  scholarlyReferences,
  isScholarlyReferencesLoading,
  onScholarSearch
}) => {
  // Render appropriate tab content based on selectedTab
  switch (selectedTab) {
    case "analysis":
      return (
        <AnalysisTabContent
          analysisData={analysisData}
          isLoading={isLoading}
          clientId={clientId}
          scholarlyReferences={scholarlyReferences}
          isScholarlyReferencesLoading={isScholarlyReferencesLoading}
          onScholarSearch={onScholarSearch}
          clientDocuments={clientDocuments}
          documentsLoading={documentsLoading}
          processDocument={processDocument}
          isProcessingDocument={isProcessingDocument}
        />
      );
    
    case "conversation":
      return <ConversationList conversation={conversation || []} loading={conversationLoading} />;
    
    case "notes":
      return <AttorneyNotesList notes={notes || []} isLoading={notesLoading} />;
    
    case "documents":
      return (
        <ClientDocumentsSection
          clientId={clientId}
          documents={clientDocuments}
          isLoading={documentsLoading}
          onProcessDocument={processDocument}
          isProcessing={isProcessingDocument}
          fullView
        />
      );
    
    default:
      return null;
  }
};

export default TabsContainer;
