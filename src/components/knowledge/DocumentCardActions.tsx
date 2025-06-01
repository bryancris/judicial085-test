
import React from "react";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { Download, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || document.contents?.[0]?.metadata?.fileType === "pdf";
  // Get PDF URL - check document.url first (where Supabase Storage URLs are stored), then fallback to metadata
  const pdfUrl = document.url || document.contents?.[0]?.metadata?.pdfUrl || "";

  // Handle PDF download
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
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
