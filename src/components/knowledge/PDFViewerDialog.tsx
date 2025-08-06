import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileIcon, Download, ExternalLink } from "lucide-react";

interface PDFViewerDialogProps {
  document: DocumentWithContent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PDFViewerDialog: React.FC<PDFViewerDialogProps> = ({
  document,
  isOpen,
  onOpenChange
}) => {
  const handleDownload = () => {
    if (document.url) {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = `${document.title || document.id}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileIcon className="h-5 w-5 text-red-500 mr-2" />
            {document.title || "PDF Document"}
          </DialogTitle>
        </DialogHeader>
        
        {document.url ? (
          <div className="p-6 text-center space-y-6">
            <div>
              <FileIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Click below to open the PDF in a new tab where you can view it with full browser controls.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button onClick={handleOpenInNewTab} variant="default" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <FileIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">PDF Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              The PDF file could not be located. The file may have been moved or the link may be broken.
            </p>
            <p className="text-sm text-muted-foreground">Document ID: {document.id}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerDialog;