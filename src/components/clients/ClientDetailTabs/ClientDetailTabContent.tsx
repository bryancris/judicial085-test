
import React, { useState, useCallback } from "react";
import { TabsContent } from "@/components/ui/tabs";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import DiscoveryTabContent from "./DiscoveryTabContent";
import ContractsTabContent from "./ContractsTabContent";
import DocumentsTabContent from "./DocumentsTabContent";
import KnowledgeTabContent from "./KnowledgeTabContent";
import TemplatesTabContent from "./TemplatesTabContent";
import { Client } from "@/types/client";
import { useCase } from "@/contexts/CaseContext";

interface ClientDetailTabContentProps {
  client: Client;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({ 
  client, 
  activeTab 
}) => {
  const { currentCase } = useCase();
  const [analysisRefreshTrigger, setAnalysisRefreshTrigger] = useState(0);
  
  // Callback to trigger analysis refresh when findings are added
  const handleAnalysisRefresh = useCallback(() => {
    setAnalysisRefreshTrigger(prev => prev + 1);
    console.log("Analysis refresh triggered from case discussion");
  }, []);
  
  return (
    <>
      <TabsContent value="client-intake" className="mt-6">
        <ClientIntakeChat 
          clientId={client.id} 
          clientName={`${client.first_name} ${client.last_name}`}
        />
      </TabsContent>

      <TabsContent value="case-analysis" className="mt-6">
        <CaseAnalysisContainer 
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          caseId={currentCase?.id}
          refreshTrigger={analysisRefreshTrigger}
        />
      </TabsContent>

      <TabsContent value="case-discussion" className="mt-6">
        <CaseDiscussionContainer 
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          onFindingsAdded={handleAnalysisRefresh}
        />
      </TabsContent>

      <TabsContent value="contracts" className="mt-6">
        <ContractsTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="discovery" className="mt-6">
        <DiscoveryTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <DocumentsTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="knowledge" className="mt-6">
        <KnowledgeTabContent clientId={client.id} />
      </TabsContent>

      <TabsContent value="templates" className="mt-6">
        <TemplatesTabContent clientId={client.id} />
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
