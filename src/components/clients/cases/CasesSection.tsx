
import React, { useState, useEffect } from "react";
import CasesList from "./CasesList";
import { Case } from "@/types/case";
import { Card, CardContent } from "@/components/ui/card";
import { useCase } from "@/contexts/CaseContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewCaseDialog from "./NewCaseDialog";
import { Button } from "@/components/ui/button";
import { useClientCases } from "@/hooks/useClientCases";
import { FileText } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface CasesSectionProps {
  clientId: string;
}

const CasesSection = ({ clientId }: CasesSectionProps) => {
  const [activeTab, setActiveTab] = useState<string>("cases");
  const { currentCase, setCurrentCase } = useCase();
  const { cases, loading, error } = useClientCases(clientId);
  
  console.log("CasesSection rendering with clientId:", clientId);
  console.log("Cases in CasesSection:", cases);

  useEffect(() => {
    // If we have cases but no current case is selected, select the first one
    if (cases.length > 0 && !currentCase) {
      console.log("Auto-selecting first case:", cases[0]);
      setCurrentCase(cases[0]);
    }
  }, [cases, currentCase, setCurrentCase]);

  const handleSelectCase = (caseData: Case) => {
    console.log("Case selected:", caseData);
    setCurrentCase(caseData);
    setActiveTab("details");
  };

  const handleNewCase = (newCase: Case) => {
    console.log("New case created:", newCase);
    setCurrentCase(newCase);
    setActiveTab("details");
  };

  return (
    <div>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="cases">
          <div className="flex justify-between items-center">
            <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium flex-grow">
              Cases
            </AccordionTrigger>
            <div className="flex">
              <NewCaseDialog clientId={clientId} onCaseCreated={handleNewCase} />
            </div>
          </div>
          <AccordionContent className="pt-6">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="cases">All Cases</TabsTrigger>
                    <TabsTrigger value="details" disabled={!currentCase}>
                      Case Details
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cases">
                    {loading ? (
                      <div className="p-8 text-center">Loading cases...</div>
                    ) : error ? (
                      <div className="p-8 text-center text-red-500">Error loading cases: {error}</div>
                    ) : cases.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                        <FileText className="mb-3 h-12 w-12 opacity-30" />
                        <p>No cases found for this client.</p>
                        <p className="mt-1 text-sm">
                          Create a new case using the "New Case" button.
                        </p>
                      </div>
                    ) : (
                      <CasesList 
                        clientId={clientId} 
                        onSelectCase={handleSelectCase}
                      />
                    )}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default CasesSection;
