
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalysisTabContent from "./AnalysisTabContent";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";
import ClientDocumentsSection from "../documents/ClientDocumentsSection";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import { ScholarlyArticle } from "@/utils/api/scholarApiService";
import { SimilarCase } from "../SimilarCasesSection";

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
  similarCases,
  isSimilarCasesLoading,
  analysisFound,
  fallbackUsed
}) => {
  return (
    <div className="mt-6">
      <Tabs value={selectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-6">
          <AnalysisTabContent
            analysisData={analysisData}
            isLoading={isLoading}
            clientId={clientId}
            scholarlyReferences={scholarlyReferences}
            isScholarlyReferencesLoading={isScholarlyReferencesLoading}
            onScholarSearch={onScholarSearch}
            similarCases={similarCases}
            isSimilarCasesLoading={isSimilarCasesLoading}
            analysisFound={analysisFound}
            fallbackUsed={fallbackUsed}
          />
        </TabsContent>

        <TabsContent value="conversation" className="mt-6">
          <ConversationList 
            conversation={conversation}
            isLoading={conversationLoading}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <AttorneyNotesList 
            notes={notes}
            isLoading={notesLoading}
            clientId={clientId}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ClientDocumentsSection
            clientDocuments={clientDocuments}
            isLoading={documentsLoading}
            clientId={clientId}
            processDocument={processDocument}
            isProcessingDocument={isProcessingDocument}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabsContainer;
