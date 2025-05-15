
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CaseForm from "./CaseForm";
import { useClientCases } from "@/hooks/useClientCases";

interface NewCaseDialogProps {
  clientId: string;
  onCaseCreated?: (caseData: any) => void;
}

const NewCaseDialog = ({ clientId, onCaseCreated }: NewCaseDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCase } = useClientCases(clientId);
  
  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const newCase = await createCase(formData);
      if (newCase && onCaseCreated) {
        onCaseCreated(newCase);
      }
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new case for this client.
          </DialogDescription>
        </DialogHeader>
        <CaseForm 
          onSubmit={handleSubmit} 
          onCancel={() => setIsOpen(false)} 
          isLoading={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default NewCaseDialog;
