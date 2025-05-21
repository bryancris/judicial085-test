
import React, { useState } from "react";
import { ClientWithCases } from "@/types/client";
import { useClientChat } from "@/hooks/useClientChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import ClientChatView from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import ClientDocumentsSection from "@/components/case-analysis/documents/ClientDocumentsSection";
import ContractReviewChat from "@/components/contract-review/ContractReviewChat";
import FaqTabContent from "@/components/clients/ClientDetailTabs/FaqTabContent";

interface ClientDetailTabContentProps {
  client: ClientWithCases;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({
  client,
  activeTab,
}) => {
  // Using hook with client.id
  const {
    messages,
    legalAnalysis,
    isLoadingHistory,
    isAnalysisLoading,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp,
  } = useClientChat(client.id);
  
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
      case "client-intake":
        return (
          <ClientChatView
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
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
        return <CaseAnalysisContainer 
          clientId={client.id} 
          clientName={`${client.first_name} ${client.last_name}`}
        />;
      case "contracts":
        return <ContractReviewChat 
          clientId={client.id} 
          clientName={`${client.first_name} ${client.last_name}`}
        />;
      case "faq":
        return <FaqTabContent />;
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
