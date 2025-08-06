import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileIcon, Download, ExternalLink, AlertCircle } from "lucide-react";

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
  const [iframeError, setIframeError] = useState(false);

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

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-background border-b">
          <DialogTitle className="flex items-center">
            <FileIcon className="h-5 w-5 text-red-500 mr-2" />
            {document.title || "PDF Document"}
          </DialogTitle>
        </DialogHeader>
        
        {document.url ? (
          <div className="flex flex-col h-[75vh]">
            {!iframeError ? (
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={document.url}
                  className="w-full h-full border-0"
                  title="PDF Document"
                  onError={handleIframeError}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Cannot display PDF</h3>
                  <p className="text-muted-foreground mb-6">
                    The PDF cannot be displayed in the browser. You can open it in a new tab or download it instead.
                  </p>
                  
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
              </div>
            )}
            
            <div className="p-4 bg-background border-t flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                PDF Viewer
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  New Tab
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
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