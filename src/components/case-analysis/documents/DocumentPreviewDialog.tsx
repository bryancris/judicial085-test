
import React from 'react';
import { DocumentWithContent } from "@/types/knowledge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface DocumentPreviewDialogProps {
  selectedDocument: DocumentWithContent | null;
  onClose: () => void;
  documentContent: string;
  loadingContent: boolean;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  selectedDocument,
  onClose,
  documentContent,
  loadingContent
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  if (!selectedDocument) return null;
  
  return (
    <Dialog open={!!selectedDocument} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {selectedDocument.title || "Document"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>{formatDate(selectedDocument.created_at)}</span>
          {selectedDocument.case_id && (
            <Badge variant="outline" className="ml-2">
              Case Document
            </Badge>
          )}
        </div>
        
        <ScrollArea className="flex-grow max-h-[calc(80vh-120px)]">
          {loadingContent ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading document content...</p>
            </div>
          ) : (
            <div className="p-4 whitespace-pre-wrap font-mono text-sm">
              {documentContent}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
