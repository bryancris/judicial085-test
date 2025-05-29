
import React from "react";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";
import ClientDocumentsSection from "../documents/ClientDocumentsSection";
import AnalysisTabContent from "./AnalysisTabContent";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { AnalysisData } from "@/hooks/useAnalysisData";

interface TabsContainerProps {
  selectedTab: string;
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
  conversation: any[];
  conversationLoading: boolean;
  notes: any[];
  notesLoading: boolean;
  clientDocuments: any[];
  documentsLoading: boolean;
  processDocument: ProcessDocumentContentFunction;
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
  // Add a dummy delete function since this component doesn't need delete functionality
  const handleDeleteDocument = async (documentId: string) => {
    console.log("Delete not implemented in tabs container:", documentId);
    return { success: false, error: "Delete not available in this view" };
  };

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
          onDeleteDocument={handleDeleteDocument}
          isProcessing={isProcessingDocument}
          fullView
        />
      );
    
    default:
      return null;
  }
};

export default TabsContainer;
