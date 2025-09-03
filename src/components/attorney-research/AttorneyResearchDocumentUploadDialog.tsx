import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

interface AttorneyResearchDocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: () => void;
  onChatInitiated?: (sessionId: string) => void;
}

const AttorneyResearchDocumentUploadDialog = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  onChatInitiated 
}: AttorneyResearchDocumentUploadDialogProps) => {
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
        <div className="mt-4">
          <LegalDisclaimer variant="inline" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttorneyResearchDocumentUploadDialog;