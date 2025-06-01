
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileText, FileIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || document.contents?.[0]?.metadata?.fileType === "pdf";
  // Get PDF URL - check document.url first (where Supabase Storage URLs are stored), then fallback to metadata
  const pdfUrl = document.url || document.contents?.[0]?.metadata?.pdfUrl || "";

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
