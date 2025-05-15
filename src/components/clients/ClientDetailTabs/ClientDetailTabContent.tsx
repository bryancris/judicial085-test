
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ClientIntakeChat from "@/components/clients/chat/ClientIntakeChat";
import CaseAnalysisContainer from "@/components/case-analysis/CaseAnalysisContainer";
import CaseDiscussionContainer from "@/components/case-discussion/CaseDiscussionContainer";
import DiscoveryContainer from "@/components/discovery/DiscoveryContainer";
import ContractReviewChat from "@/components/contract-review/ContractReviewChat";
import FaqTabContent from "./FaqTabContent";
import { Client } from "@/types/client";

interface ClientDetailTabContentProps {
  client: Client;
}

const ClientDetailTabContent = ({ client }: ClientDetailTabContentProps) => {
  return (
    <>
      <TabsContent value="client-intake" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <ClientIntakeChat clientId={client.id} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contract-review" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <ContractReviewChat clientId={client.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="fact-pattern" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Fact Pattern</h2>
            <p className="text-muted-foreground">
              Case fact pattern details will be displayed here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="discovery" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <DiscoveryContainer clientId={client.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="deposition" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Deposition</h2>
            <p className="text-muted-foreground">
              Deposition recordings and transcripts will be displayed here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="case-analysis" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <CaseAnalysisContainer clientId={client.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="discuss-case" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <CaseDiscussionContainer clientId={client.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="faq" className="py-4">
        <Card>
          <CardContent className="pt-6">
            <FaqTabContent />
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
};

export default ClientDetailTabContent;
