
import React from "react";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { Download, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { reconstructStorageUrl } from "@/utils/pdfUtils";
import { getDocumentType, canViewInline } from "@/utils/documentTypeUtils";

interface DocumentCardActionsProps {
  document: DocumentWithContent;
  onDelete?: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting?: boolean;
  onDeleteClick: () => void;
}

const DocumentCardActions: React.FC<DocumentCardActionsProps> = ({
  document,
  onDelete,
  isDeleting = false,
  onDeleteClick
}) => {
  // Detect document type
  const docType = getDocumentType(document);
  const isPdf = docType === 'pdf';
  const isDocx = docType === 'docx';
  const hasDownloadableFile = isPdf || isDocx;
  
  // Get document URL with fallback logic
  const getDocumentUrl = (): string | null => {
    // First try the document.url field (where Supabase Storage URLs should be stored)
    if (document.url) {
      console.log(`Found document URL in document.url: ${document.url}`);
      return document.url;
    }
    
    // Try metadata pdfUrl (for backward compatibility)
    const metadataUrl = document.contents?.[0]?.metadata?.pdfUrl;
    if (metadataUrl) {
      console.log(`Found document URL in metadata: ${metadataUrl}`);
      return metadataUrl;
    }
    
    // Try to reconstruct URL from storage if we have client_id and filename
    if (document.client_id && document.contents?.[0]?.metadata?.fileName) {
      const reconstructedUrl = reconstructStorageUrl(
        document.client_id, 
        document.contents[0].metadata.fileName,
        document.id
      );
      if (reconstructedUrl) {
        console.log(`Reconstructed document URL: ${reconstructedUrl}`);
        return reconstructedUrl;
      }
    }
    
    // No URL found
    console.warn(`No document URL found for document ${document.id}`, {
      hasDocumentUrl: !!document.url,
      hasMetadataUrl: !!document.contents?.[0]?.metadata?.pdfUrl,
      clientId: document.client_id,
      fileName: document.contents?.[0]?.metadata?.fileName,
      docType
    });
    return null;
  };

  const documentUrl = getDocumentUrl();

  // Handle document download/view
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (documentUrl) {
      if (canViewInline(docType)) {
        // PDFs can be viewed inline
        window.open(documentUrl, '_blank');
      } else {
        // Word docs and others should be downloaded
        const link = window.document.createElement('a');
        link.href = documentUrl;
        link.download = document.title || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } else {
      console.error(`Cannot download: No document URL available for ${docType} document`);
    }
  };

  // Handle delete button click with debugging
  const handleDeleteButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("DocumentCardActions delete button clicked for document:", document.id);
    console.log("Has onDelete:", !!onDelete);
    console.log("onDeleteClick function:", onDeleteClick);
    onDeleteClick();
  };

  // Debug logging
  console.log("DocumentCardActions render:", {
    documentId: document.id,
    hasOnDelete: !!onDelete,
    isDeleting
  });

  return (
    <>
      {/* Download/View button for documents */}
      {hasDownloadableFile && documentUrl && (
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 absolute top-2 right-12"
          onClick={handleDownload}
          title={isPdf ? "View PDF" : isDocx ? "Download Word Document" : "Download Document"}
          disabled={isDeleting}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}

      {/* Debug info for documents without URLs (only in development) */}
      {hasDownloadableFile && !documentUrl && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-12 text-xs text-red-500 bg-red-50 p-1 rounded">
          No URL
        </div>
      )}

      {/* Delete button - Always show if onDelete is provided */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10",
            isDeleting && "pointer-events-none"
          )}
          onClick={handleDeleteButtonClick}
          title="Delete document"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </>
  );
};

export default DocumentCardActions;
