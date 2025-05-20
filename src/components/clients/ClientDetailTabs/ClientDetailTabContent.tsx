
import React from "react";
import { ClientWithCases } from "@/types/client";
import { useClientChat } from "@/hooks/useClientChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import ClientChatView from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import ClientDocumentsSection from "@/components/case-analysis/documents/ClientDocumentsSection";

interface ClientDetailTabContentProps {
  client: ClientWithCases;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({
  client,
  activeTab,
}) => {
  const { messages, setMessages, legalAnalysis, isProcessing, generateAnalysis } = useClientChat(client.id);
  
  const { 
    documents, 
    loading: documentsLoading, 
    processDocument,
    deleteDocument,
    isProcessing: isDocProcessing
  } = useClientDocuments(client.id);

  // Determine which tab content to show
  const renderTabContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <ClientChatView
            client={client}
            messages={messages}
            setMessages={setMessages}
            legalAnalysis={legalAnalysis}
            generateAnalysis={generateAnalysis}
            isProcessing={isProcessing}
          />
        );
      case "documents":
        return (
          <div className="p-4">
            <ClientDocumentsSection 
              clientId={client.id}
              documents={documents}
              isLoading={documentsLoading}
              onProcessDocument={processDocument}
              onDeleteDocument={deleteDocument}
              isProcessing={isDocProcessing}
              fullView={true}
            />
          </div>
        );
      case "analysis":
        return <CaseAnalysisContainer clientId={client.id} />;
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-gray-500">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {renderTabContent()}
    </div>
  );
};

export default ClientDetailTabContent;
