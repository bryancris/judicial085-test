
import React, { useState, useEffect } from "react";
import { ClientWithCases } from "@/types/client";
import { useClientChat } from "@/hooks/useClientChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { useCaseDocuments } from "@/hooks/useCaseDocuments";
import { useCase } from "@/contexts/CaseContext";
import ClientChatView from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import ClientDocumentsSection from "@/components/case-analysis/documents/ClientDocumentsSection";
import ContractReviewChat from "@/components/contract-review/ContractReviewChat";
import FaqTabContent from "@/components/clients/ClientDetailTabs/FaqTabContent";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpenCheck } from "lucide-react";

interface ClientDetailTabContentProps {
  client: ClientWithCases;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({
  client,
  activeTab,
}) => {
  // Get current case from context
  const { currentCase, isLoading: caseLoading } = useCase();
  
  // Set document scope - "client" for client-level documents or a specific caseId
  const [documentScope, setDocumentScope] = useState<string>("client");
  
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
  
  // Client-level documents (or filtered by case when documentScope is set)
  const { 
    documents: clientDocuments, 
    loading: clientDocumentsLoading, 
    processDocument: processClientDocument,
    deleteDocument: deleteClientDocument,
    isProcessing: isClientDocProcessing
  } = useClientDocuments(
    client.id, 
    5,  
    documentScope === "client" ? "client-level" : (documentScope !== "all" ? documentScope : undefined)
  );
  
  // Case-specific documents (when currentCase is available)
  const {
    documents: caseDocuments,
    loading: caseDocumentsLoading,
    processDocument: processCaseDocument,
    deleteDocument: deleteCaseDocument,
    isProcessing: isCaseDocProcessing
  } = useCaseDocuments(
    client.id,
    currentCase?.id
  );
  
  // Reset document scope when tab changes
  useEffect(() => {
    if (activeTab === "documents") {
      // Default to "client" view or current case if available
      setDocumentScope(currentCase?.id || "client");
    }
  }, [activeTab, currentCase]);
  
  // Combined documents based on scope
  const documents = documentScope === "case" && currentCase 
    ? caseDocuments
    : clientDocuments;
    
  const documentsLoading = documentScope === "case" && currentCase
    ? caseDocumentsLoading
    : clientDocumentsLoading;
    
  const isDocProcessing = documentScope === "case" && currentCase
    ? isCaseDocProcessing
    : isClientDocProcessing;
    
  // Smart document processor that handles both client and case documents
  const processDocument = async (title: string, content: string, metadata: any = {}) => {
    if (documentScope === "client" || (!currentCase && documentScope !== "case")) {
      // Process as client-level document
      return processClientDocument(title, content, metadata);
    } else if (currentCase && (documentScope === "case" || documentScope === currentCase.id)) {
      // Process as case-specific document
      return processCaseDocument(title, content, metadata);
    } else if (documentScope !== "all" && documentScope !== "client" && documentScope !== "case") {
      // Process as document for a specific case (by ID)
      return processClientDocument(title, content, { ...metadata, caseId: documentScope });
    } else {
      // Default to client-level document
      return processClientDocument(title, content, metadata);
    }
  };
  
  // Smart document deletion
  const deleteDocument = (docId: string) => {
    if (documentScope === "case" && currentCase) {
      return deleteCaseDocument(docId);
    } else {
      return deleteClientDocument(docId);
    }
  };

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
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-lg font-medium mb-1 flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5" />
                  Document Library
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentCase 
                    ? `Managing documents for ${client.first_name}'s cases` 
                    : `Managing documents for ${client.first_name} ${client.last_name}`}
                </p>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={documentScope} 
                  onValueChange={setDocumentScope}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Select document scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">
                      <span className="flex items-center gap-2">
                        Client Level
                        <Badge variant="outline">General</Badge>
                      </span>
                    </SelectItem>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        All Documents
                        <Badge variant="outline">Everything</Badge>
                      </span>
                    </SelectItem>
                    {client.cases && client.cases.length > 0 && (
                      <>
                        <SelectItem value="case" disabled={!currentCase}>
                          <span className="flex items-center gap-2">
                            Current Case
                            <Badge>{currentCase?.case_title || "None Selected"}</Badge>
                          </span>
                        </SelectItem>
                        {client.cases.map(caseItem => (
                          <SelectItem key={caseItem.id} value={caseItem.id}>
                            <span className="flex items-center gap-2 truncate max-w-[180px]">
                              {caseItem.case_title}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ClientDocumentsSection 
              clientId={client.id}
              documents={documents}
              isLoading={documentsLoading}
              onProcessDocument={processDocument}
              onDeleteDocument={deleteDocument}
              isProcessing={isDocProcessing}
              fullView={true}
              caseId={documentScope !== "client" && documentScope !== "all" ? documentScope : undefined}
              caseName={
                currentCase && (documentScope === "case" || documentScope === currentCase.id) 
                  ? currentCase.case_title 
                  : undefined
              }
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
      case "discussion":
        return <CaseDiscussionContainer clientId={client.id} />;
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
