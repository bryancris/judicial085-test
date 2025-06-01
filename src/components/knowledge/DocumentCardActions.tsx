
import React from "react";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { Download, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { reconstructStorageUrl } from "@/utils/pdfUtils";

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
  // Check if this is a PDF document
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || 
               document.contents?.[0]?.metadata?.fileType === "pdf" ||
               document.title?.toLowerCase().endsWith('.pdf');
  
  // Get PDF URL with fallback logic
  const getPdfUrl = (): string | null => {
    // First try the document.url field (where Supabase Storage URLs should be stored)
    if (document.url) {
      console.log(`Found PDF URL in document.url: ${document.url}`);
      return document.url;
    }
    
    // Try metadata pdfUrl
    const metadataPdfUrl = document.contents?.[0]?.metadata?.pdfUrl;
    if (metadataPdfUrl) {
      console.log(`Found PDF URL in metadata: ${metadataPdfUrl}`);
      return metadataPdfUrl;
    }
    
    // Try to reconstruct URL from storage if we have client_id and filename
    if (document.client_id && document.contents?.[0]?.metadata?.fileName) {
      const reconstructedUrl = reconstructStorageUrl(
        document.client_id, 
        document.contents[0].metadata.fileName,
        document.id
      );
      if (reconstructedUrl) {
        console.log(`Reconstructed PDF URL: ${reconstructedUrl}`);
        return reconstructedUrl;
      }
    }
    
    // No URL found
    console.warn(`No PDF URL found for document ${document.id}`, {
      hasDocumentUrl: !!document.url,
      hasMetadataUrl: !!document.contents?.[0]?.metadata?.pdfUrl,
      clientId: document.client_id,
      fileName: document.contents?.[0]?.metadata?.fileName
    });
    return null;
  };

  const pdfUrl = getPdfUrl();

  // Handle PDF download
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      console.error('Cannot download: No PDF URL available');
    }
  };

  return (
    <>
      {/* Download button for PDFs */}
      {isPdf && pdfUrl && (
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 absolute top-2 right-12"
          onClick={handleDownload}
          title="Download PDF"
          disabled={isDeleting}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}

      {/* Debug info for PDFs without URLs (only in development) */}
      {isPdf && !pdfUrl && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-12 text-xs text-red-500 bg-red-50 p-1 rounded">
          No URL
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10",
            isDeleting && "pointer-events-none"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
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
