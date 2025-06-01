
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import DiscoveryTabContent from "./DiscoveryTabContent";
import ContractsTabContent from "./ContractsTabContent";
import DocumentsTabContent from "./DocumentsTabContent";
import KnowledgeTabContent from "./KnowledgeTabContent";
import FaqTabContent from "./FaqTabContent";
import { Client } from "@/types/client";

interface ClientDetailTabContentProps {
  client: Client;
  activeTab: string;
}

const ClientDetailTabContent: React.FC<ClientDetailTabContentProps> = ({ 
  client, 
  activeTab 
}) => {
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
        />
      </TabsContent>

      <TabsContent value="case-discussion" className="mt-6">
        <CaseDiscussionContainer 
          clientId={client.id}
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

      <TabsContent value="faq" className="mt-6">
        <FaqTabContent clientId={client.id} />
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
