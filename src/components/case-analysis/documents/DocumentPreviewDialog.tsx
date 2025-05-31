
import React from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, FileIcon } from "lucide-react";

interface DocumentPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentWithContent | null;
  onViewPdf: (document: DocumentWithContent) => void;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  isOpen,
  onClose,
  document,
  onViewPdf
}) => {
  // Improved PDF detection function
  const isPdfDocument = (document: DocumentWithContent): boolean => {
    const titleIsPdf = document.title?.toLowerCase().endsWith('.pdf');
    const schemaIsPdf = document.schema === 'pdf';
    const contentMetadata = document.contents?.[0]?.metadata;
    const contentIsPdf = contentMetadata?.isPdfDocument === true ||
      contentMetadata?.blobType === 'application/pdf' ||
      contentMetadata?.file_type === "pdf";
    const urlIsPdf = document.url?.includes('drive.google.com') || 
                    document.url?.toLowerCase().includes('.pdf');
    
    return titleIsPdf || schemaIsPdf || contentIsPdf || urlIsPdf;
  };

  // Helper function to get PDF URL
  const getPdfUrl = (document: DocumentWithContent): string | null => {
    const possibleUrls = [
      document.url,
      document.contents?.[0]?.metadata?.pdfUrl,
      document.contents?.[0]?.metadata?.pdf_url,
      document.contents?.[0]?.metadata?.file_path,
      document.contents?.[0]?.metadata?.url
    ];
    
    return possibleUrls.find(url => url && typeof url === 'string' && url.trim().length > 0) || null;
  };

  // Get document content
  const getDocumentContent = (document: DocumentWithContent): string => {
    if (!document.contents || document.contents.length === 0) {
      return "No content available for this document.";
    }
    
    const content = document.contents[0]?.content;
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return "Document content could not be extracted or is empty.";
    }
    
    return content;
  };

  if (!document) return null;

  const isPdf = isPdfDocument(document);
  const pdfUrl = getPdfUrl(document);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isPdf ? (
              <FileIcon className="h-5 w-5 text-red-500 mr-2" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
            )}
            {document.title || "Untitled Document"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
            {getDocumentContent(document)}
          </div>
        </div>
        
        {isPdf && pdfUrl && (
          <div className="border-t pt-4 flex justify-end">
            <Button 
              variant="default" 
              onClick={() => onViewPdf(document)}
              className="flex items-center"
            >
              <FileIcon className="h-4 w-4 mr-2" />
              View Original PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
