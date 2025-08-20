import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, X } from "lucide-react";
import CaseForm from "./cases/CaseForm";
import { useClientCases } from "@/hooks/useClientCases";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface PostClientCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onComplete: () => void;
}

const PostClientCreationDialog = ({ 
  isOpen, 
  onOpenChange, 
  clientId, 
  clientName,
  onComplete 
}: PostClientCreationDialogProps) => {
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { createCase } = useClientCases(clientId);
  const { toast } = useToast();

  const handleCreateCase = () => {
    setShowCaseForm(true);
  };

  const handleCaseSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const caseDataWithClientId = {
        ...formData,
        client_id: clientId
      };
      
      await createCase(caseDataWithClientId);
      
      toast({
        title: "Case created successfully",
        description: `Case "${formData.case_title}" has been created for ${clientName}.`,
      });

      handleComplete();
    } catch (error) {
      console.error("Error creating case:", error);
      toast({
        title: "Error creating case",
        description: "There was a problem creating the case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('hidePostClientCasePrompt', 'true');
    }
    onOpenChange(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleRemindLater = () => {
    toast({
      title: "Reminder set",
      description: "You can create a case from the client details page.",
    });
    handleComplete();
  };

  if (showCaseForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Case for {clientName}</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new case for this client.
            </DialogDescription>
          </DialogHeader>
          <CaseForm 
            onSubmit={handleCaseSubmit} 
            onCancel={() => setShowCaseForm(false)} 
            isLoading={isSubmitting}
            clientId={clientId}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Create a Case?
          </DialogTitle>
          <DialogDescription>
            You've successfully created the client <strong>{clientName}</strong>. 
            Would you like to create a case for them now?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button 
            onClick={handleCreateCase}
            className="w-full"
            size="lg"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Case Now
          </Button>
          
          <Button 
            onClick={handleRemindLater}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Clock className="h-4 w-4 mr-2" />
            Remind Me Later
          </Button>
          
          <Button 
            onClick={handleSkip}
            variant="ghost"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
        </div>

        <div className="flex items-center space-x-2 pt-4 border-t">
          <Checkbox 
            id="dont-show-again"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
          />
          <label 
            htmlFor="dont-show-again" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don't show this again
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostClientCreationDialog;