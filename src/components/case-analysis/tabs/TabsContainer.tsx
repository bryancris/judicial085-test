
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import AnalysisTabContent from "./AnalysisTabContent";
import ConversationList from "../conversation/ConversationList";
import AttorneyNotesList from "../conversation/AttorneyNotesList";

import { AnalysisData } from "@/hooks/useAnalysisData";

interface TabsContainerProps {
  selectedTab: string;
  analysisData: AnalysisData;
  isLoading: boolean;
  regenerateStep7?: () => void;
  regenerateStep8?: () => void;
  isRegeneratingStep7?: boolean;
  isRegeneratingStep8?: boolean;
  clientId: string;
  caseId?: string;
  currentAnalysisId?: string;
  conversation: any[];
  conversationLoading: boolean;
  notes: any[];
  notesLoading: boolean;
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
  regenerateStep7,
  regenerateStep8,
  isRegeneratingStep7,
  isRegeneratingStep8,
}) => {
  return (
    <div className="mt-6">
      {selectedTab === "analysis" && (
        <div className="mt-6">
          <AnalysisTabContent
            analysisData={analysisData}
            isLoading={isLoading}
            clientId={clientId}
            regenerateStep7={regenerateStep7}
            regenerateStep8={regenerateStep8}
            isRegeneratingStep7={isRegeneratingStep7}
            isRegeneratingStep8={isRegeneratingStep8}
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
