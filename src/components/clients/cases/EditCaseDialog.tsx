
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CaseForm from "./CaseForm";
import { Case } from "@/types/case";

interface EditCaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCase: Case | null;
  onSubmit: (formData: any) => void;
}

const EditCaseDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedCase, 
  onSubmit 
}: EditCaseDialogProps) => {
  if (!selectedCase) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>
            Make changes to the case details below.
          </DialogDescription>
        </DialogHeader>
        <CaseForm
          initialData={selectedCase}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditCaseDialog;
