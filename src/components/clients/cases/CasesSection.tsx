
import React, { useState } from "react";
import CasesList from "./CasesList";
import { Case } from "@/types/case";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCase } from "@/contexts/CaseContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewCaseDialog from "./NewCaseDialog";
import { Button } from "@/components/ui/button";

interface CasesSectionProps {
  clientId: string;
}

const CasesSection = ({ clientId }: CasesSectionProps) => {
  const [activeTab, setActiveTab] = useState<string>("cases");
  const { currentCase, setCurrentCase } = useCase();

  const handleSelectCase = (caseData: Case) => {
    setCurrentCase(caseData);
    setActiveTab("details");
  };

  const handleNewCase = (newCase: Case) => {
    setCurrentCase(newCase);
    setActiveTab("details");
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Cases</CardTitle>
        <NewCaseDialog clientId={clientId} onCaseCreated={handleNewCase} />
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cases">All Cases</TabsTrigger>
            <TabsTrigger value="details" disabled={!currentCase}>
              Case Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cases">
            <CasesList 
              clientId={clientId} 
              onSelectCase={handleSelectCase} 
            />
          </TabsContent>
          
          <TabsContent value="details">
            {currentCase && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("cases")}
                  className="mb-2"
                >
                  ← Back to All Cases
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{currentCase.case_title}</h3>
                    {currentCase.case_number && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Case Number:</span> {currentCase.case_number}
                      </p>
                    )}
                    {currentCase.case_type && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">Type:</span> {currentCase.case_type}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Status:</span> {currentCase.status}
                    </p>
                  </div>
                  
                  <div>
                    {currentCase.case_description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm">{currentCase.case_description}</p>
                      </div>
                    )}
                    {currentCase.case_notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes</h4>
                        <p className="text-sm">{currentCase.case_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CasesSection;
