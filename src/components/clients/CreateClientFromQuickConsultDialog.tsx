import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { clientSchema, ClientFormValues, defaultValues } from "./ClientFormSchema";
import { caseSchema, CaseFormValues, caseDefaultValues } from "./cases/CaseFormSchema";
import PersonalInfoFields from "./PersonalInfoFields";
import AddressFields from "./AddressFields";
import CaseInfoFields from "./CaseInfoFields";
import CaseFormFields from "./cases/CaseFormFields";
import { useCreateClientFromQuickConsult } from "@/hooks/useCreateClientFromQuickConsult";
import { QuickConsultMessage } from "@/utils/api/quickConsultService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CreateClientFromQuickConsultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: QuickConsultMessage[];
  onSuccess: (clientId: string, caseId: string) => void;
}

type Step = "client" | "case" | "review";

const CreateClientFromQuickConsultDialog = ({
  open,
  onOpenChange,
  messages,
  onSuccess,
}: CreateClientFromQuickConsultDialogProps) => {
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const { createClientWithCase, isLoading } = useCreateClientFromQuickConsult();

  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const caseForm = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      ...caseDefaultValues,
      case_title: messages.length > 0 ? 
        messages.find(m => m.role === "user")?.content.slice(0, 100) + "..." || "Quick Consult Case" :
        "Quick Consult Case",
      case_description: messages.length > 0 ? 
        `Imported from Quick Consult session with ${messages.length} messages` : 
        "Case created from Quick Consult",
    },
  });

  const handleNextStep = async () => {
    if (currentStep === "client") {
      const isValid = await clientForm.trigger();
      if (isValid) {
        setCurrentStep("case");
      }
    } else if (currentStep === "case") {
      const isValid = await caseForm.trigger();
      if (isValid) {
        setCurrentStep("review");
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "case") {
      setCurrentStep("client");
    } else if (currentStep === "review") {
      setCurrentStep("case");
    }
  };

  const handleCreateClient = async () => {
    const clientData = clientForm.getValues();
    const caseData = caseForm.getValues();

    try {
      const { clientId, caseId } = await createClientWithCase(
        clientData,
        caseData,
        messages
      );
      
      onSuccess(clientId, caseId);
      onOpenChange(false);
      
      // Reset forms
      clientForm.reset();
      caseForm.reset();
      setCurrentStep("client");
    } catch (error) {
      console.error("Failed to create client and case:", error);
    }
  };

  const stepTitles = {
    client: "Client Information",
    case: "Case Information", 
    review: "Review & Create"
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {["client", "case", "review"].map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted = 
          (step === "client" && (currentStep === "case" || currentStep === "review")) ||
          (step === "case" && currentStep === "review");

        return (
          <React.Fragment key={step}>
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isActive 
                  ? "border-primary bg-primary text-primary-foreground" 
                  : isCompleted
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted bg-background text-muted-foreground"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < 2 && (
              <div 
                className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? "bg-green-500" : "bg-muted"
                }`} 
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderClientStep = () => (
    <Form {...clientForm}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalInfoFields control={clientForm.control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressFields control={clientForm.control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseInfoFields control={clientForm.control} />
          </CardContent>
        </Card>
      </form>
    </Form>
  );

  const renderCaseStep = () => (
    <Form {...caseForm}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseFormFields control={caseForm.control} />
          </CardContent>
        </Card>
      </form>
    </Form>
  );

  const renderReviewStep = () => {
    const clientData = clientForm.getValues();
    const caseData = caseForm.getValues();

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {clientData.first_name} {clientData.last_name}</p>
            <p><strong>Email:</strong> {clientData.email}</p>
            <p><strong>Phone:</strong> {clientData.phone}</p>
            {clientData.address && (
              <p><strong>Address:</strong> {clientData.address}, {clientData.city}, {clientData.state} {clientData.zip_code}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Title:</strong> {caseData.case_title}</p>
            <p><strong>Type:</strong> {caseData.case_type || "Not specified"}</p>
            <p><strong>Description:</strong> {caseData.case_description}</p>
            <p><strong>Status:</strong> <Badge variant="secondary">{caseData.status}</Badge></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Consult Messages to Import</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={message.role === "user" ? "default" : "secondary"}>
                        {message.role === "user" ? "Attorney" : "AI Assistant"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <p className="text-sm truncate">{message.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground mt-2">
              {messages.length} messages will be imported to the client intake chat
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "client":
        return renderClientStep();
      case "case":
        return renderCaseStep();
      case "review":
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center">
            Create Client from Quick Consult
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {renderStepIndicator()}
          
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold">{stepTitles[currentStep]}</h3>
          </div>

          <ScrollArea className="flex-1 px-1">
            {renderStepContent()}
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === "client" || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={handleCreateClient}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Client & Case"}
              </Button>
            ) : (
              <Button
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientFromQuickConsultDialog;