
import React, { useState } from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2, FileIcon, Download, Eye, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

  // Helper function to check if document is a PDF
  const isPdfDocument = (document: DocumentWithContent): boolean => {
    // Check multiple locations for PDF indicators
    const contentMetadata = document.contents?.[0]?.metadata;
    
    // Check various PDF indicators
    const indicators = [
      contentMetadata?.isPdfDocument,
      contentMetadata?.fileType === "pdf",
      contentMetadata?.file_type === "pdf",
      document.title?.toLowerCase().endsWith('.pdf'),
      document.url?.toLowerCase().includes('.pdf')
    ];
    
    return indicators.some(indicator => indicator === true);
  };

  // Helper function to get PDF URL
  const getPdfUrl = (document: DocumentWithContent): string | null => {
    const contentMetadata = document.contents?.[0]?.metadata;
    
    // Check various locations for PDF URL
    const urls = [
      contentMetadata?.pdfUrl,
      contentMetadata?.pdf_url,
      contentMetadata?.url,
      document.url
    ];
    
    const pdfUrl = urls.find(url => url && typeof url === 'string');
    console.log('PDF URL found:', pdfUrl, 'for document:', document.title);
    return pdfUrl || null;
  };

  // Helper function to get document content for preview
  const getDocumentContent = (document: DocumentWithContent): string => {
    if (!document.contents || document.contents.length === 0) {
      return "No content available for this document.";
    }
    
    // Combine all content chunks
    const allContent = document.contents
      .map(content => content.content)
      .filter(content => content && content.trim().length > 0)
      .join('\n\n');
    
    return allContent || "Document content could not be loaded.";
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
    console.log('Viewing document:', document.title, 'Contents:', document.contents);
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
        description: "The PDF file could not be found.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
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
        {documents.map((document) => {
          const isPdf = isPdfDocument(document);
          const pdfUrl = getPdfUrl(document);
          const content = getDocumentContent(document);
          const truncatedContent = content.length > 150 
            ? `${content.substring(0, 150)}...` 
            : content;

          // Debug logging
          console.log('Document:', document.title, 'isPdf:', isPdf, 'pdfUrl:', pdfUrl);

          return (
            <Card key={document.id} className="hover:shadow-md transition-shadow relative group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {isPdf ? (
                      <FileIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-sm truncate" title={document.title || "Untitled"}>
                      {document.title || "Untitled Document"}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(document)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mb-3">
                  {isPdf ? (
                    <div className="text-gray-600 text-sm italic flex items-center">
                      <FileIcon className="h-4 w-4 mr-1 text-red-500" />
                      PDF Document
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm line-clamp-3 whitespace-pre-wrap">
                      {truncatedContent}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{new Date(document.created_at || "").toLocaleDateString()}</span>
                  {document.contents && document.contents.length > 0 && (
                    <span>{document.contents.length} chunk{document.contents.length !== 1 ? 's' : ''}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(document)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  
                  {isPdf && pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPdf(document)}
                      className="flex items-center gap-2"
                      title="View original PDF"
                    >
                      <Download className="h-4 w-4" />
                      View PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedDocument && isPdfDocument(selectedDocument) ? (
                <FileIcon className="h-5 w-5 text-red-500 mr-2" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
              )}
              {selectedDocument?.title || "Untitled Document"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {selectedDocument && (
              <div className="whitespace-pre-wrap">
                {getDocumentContent(selectedDocument)}
              </div>
            )}
          </div>
          
          {selectedDocument && isPdfDocument(selectedDocument) && getPdfUrl(selectedDocument) && (
            <div className="border-t pt-4 flex justify-end">
              <Button 
                variant="default" 
                onClick={() => handleViewPdf(selectedDocument)}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                View Original PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!localIsDeleting) {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteError(null);
            setDocumentToDelete(null);
          }
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title || "Untitled Document"}"?
              This action cannot be undone and will permanently remove the document and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-3 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{deleteError}</p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={localIsDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                if (documentToDelete) {
                  handleDelete(documentToDelete);
                }
              }}
              disabled={localIsDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {localIsDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsGrid;
