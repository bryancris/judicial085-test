import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QuickConsultDocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: () => void;
  onChatInitiated?: (sessionId: string) => void;
}

const QuickConsultDocumentUploadDialog = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  onChatInitiated 
}: QuickConsultDocumentUploadDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Document Upload</DialogTitle>
          <DialogDescription>
            Document upload feature is being updated for the new 3-Agent AI system.
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground">
          This feature will be available once the AI Agents integration is complete.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default QuickConsultDocumentUploadDialog;