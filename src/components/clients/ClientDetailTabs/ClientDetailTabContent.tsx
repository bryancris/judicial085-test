
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import VoiceTranscriptViewer from "@/components/case-discussion/VoiceTranscriptViewer";
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

      <TabsContent value="voice-transcripts" className="mt-6">
        <VoiceTranscriptViewer clientId={client.id} />
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
