
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileText, FileIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { reconstructStorageUrl } from "@/utils/pdfUtils";

interface DocumentPreviewDialogProps {
  document: DocumentWithContent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  document,
  isOpen,
  onOpenChange
}) => {
  // Check if this is a PDF document
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || 
               document.contents?.[0]?.metadata?.fileType === "pdf" ||
               document.title?.toLowerCase().endsWith('.pdf');
  
  // Get PDF URL with fallback logic (same as DocumentCardActions)
  const getPdfUrl = (): string | null => {
    // First try the document.url field
    if (document.url) {
      return document.url;
    }
    
    // Try metadata pdfUrl
    const metadataPdfUrl = document.contents?.[0]?.metadata?.pdfUrl;
    if (metadataPdfUrl) {
      return metadataPdfUrl;
    }
    
    // Try to reconstruct URL from storage
    if (document.client_id && document.contents?.[0]?.metadata?.fileName) {
      return reconstructStorageUrl(
        document.client_id, 
        document.contents[0].metadata.fileName,
        document.id
      );
    }
    
    return null;
  };

  const pdfUrl = getPdfUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-4xl max-h-[85vh]", isPdf ? "p-0 overflow-hidden" : "")}>
        <DialogHeader className={isPdf ? "p-4 bg-white border-b" : ""}>
          <DialogTitle className="flex items-center">
            {isPdf ? (
              <FileIcon className="h-5 w-5 text-red-500 mr-2" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
            )}
            {document.title || "Untitled Document"}
          </DialogTitle>
        </DialogHeader>
        
        {isPdf && pdfUrl ? (
          <div className="h-[70vh] overflow-hidden">
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full"
              title={document.title || "PDF Document"}
              sandbox="allow-scripts allow-same-origin"
            />
            <div className="p-4 bg-white border-t flex justify-end">
              <Button 
                variant="default" 
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : isPdf && !pdfUrl ? (
          <div className="p-8 text-center">
            <FileIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">PDF Preview Unavailable</h3>
            <p className="text-gray-600 mb-4">
              The PDF file could not be loaded. The file may have been moved or the link may be broken.
            </p>
            <p className="text-sm text-gray-500">Document ID: {document.id}</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[60vh] whitespace-pre-wrap">
            {document.contents.map((contentItem, i) => (
              <p key={i} className="mb-4">{contentItem.content}</p>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
