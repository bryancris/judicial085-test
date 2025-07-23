
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import AnalysisTabContent from "./AnalysisTabContent";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";
import ClientDocumentsSection from "../documents/ClientDocumentsSection";
import LegalResearchTab from "../research/LegalResearchTab";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { SimilarCase } from "../SimilarCasesSection";

interface TabsContainerProps {
  selectedTab: string;
  analysisData: AnalysisData;
  isLoading: boolean;
  clientId: string;
  caseId?: string;
  currentAnalysisId?: string;
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
  onScholarRefresh?: () => void;
  similarCases: SimilarCase[];
  isSimilarCasesLoading: boolean;
  analysisFound: boolean;
  fallbackUsed: boolean;
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  selectedTab,
  analysisData,
  isLoading,
  clientId,
  caseId,
  currentAnalysisId,
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
  onScholarSearch,
  onScholarRefresh,
  similarCases,
  isSimilarCasesLoading,
  analysisFound,
  fallbackUsed
}) => {
  return (
    <div className="mt-6">
      {selectedTab === "analysis" && (
        <div className="mt-6">
          <AnalysisTabContent
            analysisData={analysisData}
            isLoading={isLoading}
            clientId={clientId}
            scholarlyReferences={scholarlyReferences}
            isScholarlyReferencesLoading={isScholarlyReferencesLoading}
            onScholarSearch={onScholarSearch}
            onScholarRefresh={onScholarRefresh}
            similarCases={similarCases}
            isSimilarCasesLoading={isSimilarCasesLoading}
            analysisFound={analysisFound}
            fallbackUsed={fallbackUsed}
          />
        </div>
      )}

      {selectedTab === "conversation" && (
        <div className="mt-6">
          <ConversationList 
            conversation={conversation}
            loading={conversationLoading}
          />
        </div>
      )}

      {selectedTab === "notes" && (
        <div className="mt-6">
          <AttorneyNotesList 
            notes={notes}
            isLoading={notesLoading}
          />
        </div>
      )}

      {selectedTab === "documents" && (
        <div className="mt-6">
          <ClientDocumentsSection
            clientId={clientId}
            documents={clientDocuments}
            isLoading={documentsLoading}
            onProcessDocument={processDocument}
            onDeleteDocument={async () => {}}
            onToggleDocumentAnalysis={async () => {}}
            isProcessing={isProcessingDocument}
          />
        </div>
      )}

      {selectedTab === "research" && (
        <div className="mt-6">
          <LegalResearchTab
            clientId={clientId}
            caseId={caseId}
            currentAnalysisId={currentAnalysisId}
          />
        </div>
      )}
    </div>
  );
};

export default TabsContainer;
