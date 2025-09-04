
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import AnalysisTabContent from "./AnalysisTabContent";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";

import { AnalysisData } from "@/hooks/useAnalysisData";
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
  scholarlyReferences: ScholarlyArticle[];
  isScholarlyReferencesLoading: boolean;
  onScholarSearch: (query: string) => void;
  onScholarRefresh?: () => void;
  similarCases: SimilarCase[];
  isSimilarCasesLoading: boolean;
  analysisFound: boolean;
  fallbackUsed: boolean;
  onSimilarCasesRefresh?: () => void;
  viewMode?: 'irac' | 'traditional';
  onViewModeChange?: (mode: 'irac' | 'traditional') => void;
  supportsIrac?: boolean;
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
  scholarlyReferences,
  isScholarlyReferencesLoading,
  onScholarSearch,
  onScholarRefresh,
  similarCases,
  isSimilarCasesLoading,
  analysisFound,
  fallbackUsed,
  onSimilarCasesRefresh,
  viewMode,
  onViewModeChange,
  supportsIrac
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
            onSimilarCasesRefresh={onSimilarCasesRefresh}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            supportsIrac={supportsIrac}
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


    </div>
  );
};

export default TabsContainer;
