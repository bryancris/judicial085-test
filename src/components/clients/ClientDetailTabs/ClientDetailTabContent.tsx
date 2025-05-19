
import React, { useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import ClientIntakeChat from "../chat/ClientIntakeChat";
import LegalAnalysisView from "../chat/LegalAnalysisView";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import ContractReviewChat from "@/components/contract-review/ContractReviewChat";
import DiscoveryContainer from "@/components/discovery/DiscoveryContainer";
import { Card, CardContent } from "@/components/ui/card";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import ClientDocumentsSection from "@/components/case-analysis/documents/ClientDocumentsSection";
import { Client } from "@/types/client";
import FaqTabContent from "./FaqTabContent";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";

interface ClientDetailTabContentProps {
  client: Client;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({ client }) => {
  // Client documents hook for the documents tab
  const {
    documents: clientDocuments,
    loading: documentsLoading,
    processDocument,
    isProcessing: isProcessingDocument
  } = useClientDocuments(client.id);
  
  const clientName = `${client.first_name} ${client.last_name}`;
  
  // Load legal analysis for the analysis tab
  const { legalAnalysis, isLoadingHistory } = useClientChatHistory(client.id);
  
  return (
    <>
      <TabsContent value="client-intake">
        <ClientIntakeChat clientId={client.id} clientName={clientName} />
      </TabsContent>
      
      <TabsContent value="analysis">
        <LegalAnalysisView 
          analysisItems={legalAnalysis}
          isLoading={isLoadingHistory}
          clientId={client.id}
        />
      </TabsContent>
      
      <TabsContent value="discovery">
        <DiscoveryContainer clientId={client.id} />
      </TabsContent>
      
      <TabsContent value="discussion">
        <CaseDiscussionContainer clientId={client.id} />
      </TabsContent>

      <TabsContent value="contracts">
        <ContractReviewChat clientId={client.id} clientName={clientName} />
      </TabsContent>
      
      <TabsContent value="documents">
        <Card>
          <CardContent className="p-6">
            <ClientDocumentsSection
              clientId={client.id}
              documents={clientDocuments}
              isLoading={documentsLoading}
              onProcessDocument={processDocument}
              isProcessing={isProcessingDocument}
              fullView
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="knowledge">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Legal Resources</h2>
            <p>Resources and knowledge base content related to this client's case will appear here.</p>
            {/* Knowledge base content would go here */}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="notes">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Client Notes</h2>
            <p>Client notes will appear here.</p>
            {/* Notes content would go here */}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="faq">
        <FaqTabContent />
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
