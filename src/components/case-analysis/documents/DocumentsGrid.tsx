
import React, { useState } from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DocumentCard from "./DocumentCard";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";

interface DocumentsGridProps {
  documents: DocumentWithContent[];
  isLoading: boolean;
  onDeleteDocument: (documentId: string) => Promise<any>;
  fullView?: boolean;
}

const DocumentsGrid: React.FC<DocumentsGridProps> = ({
  documents,
  isLoading,
  onDeleteDocument,
  fullView = false
}) => {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithContent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithContent | null>(null);
  const [localIsDeleting, setLocalIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDelete = async (document: DocumentWithContent) => {
    if (!document.id) {
      setDeleteError("Cannot delete this document: Invalid document ID");
      return;
    }
    
    setLocalIsDeleting(true);
    setDeleteError(null);
    
    try {
      console.log(`DocumentsGrid: Initiating delete for document ${document.id}`);
      
      const result = await onDeleteDocument(document.id);
      
      console.log(`DocumentsGrid: Delete result for document ${document.id}:`, result);
      
      if (result.success !== false) {
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
        toast({
          title: "Document deleted",
          description: "Document was successfully deleted",
        });
      } else {
        throw new Error(result.error || "Unknown error occurred during deletion");
      }
    } catch (error: any) {
      console.error("Error in document deletion:", error);
      setDeleteError(error.message || "Failed to delete document");
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocalIsDeleting(false);
    }
  };

  const handleViewDocument = (document: DocumentWithContent) => {
    console.log('Viewing document:', document.title);
    setSelectedDocument(document);
    setPreviewOpen(true);
  };

  const handleDeleteClick = (document: DocumentWithContent) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  // Handle PDF viewing/download
  const handleViewPdf = (document: DocumentWithContent) => {
    const pdfUrl = getPdfUrl(document);
    if (pdfUrl) {
      console.log('Opening PDF:', pdfUrl);
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF not available",
        description: "The PDF file could not be found or accessed.",
        variant: "destructive",
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedDocument(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
    setDeleteError(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onView={handleViewDocument}
            onDelete={handleDeleteClick}
            onViewPdf={handleViewPdf}
          />
        ))}
      </div>

      <DocumentPreviewDialog
        isOpen={previewOpen}
        onClose={handleClosePreview}
        document={selectedDocument}
        onViewPdf={handleViewPdf}
      />

      <DocumentDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        document={documentToDelete}
        onConfirmDelete={handleDelete}
        isDeleting={localIsDeleting}
        error={deleteError}
      />
    </>
  );
};

export default DocumentsGrid;
