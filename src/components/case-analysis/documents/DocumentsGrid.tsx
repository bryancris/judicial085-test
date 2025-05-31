
import React from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleDelete = async (documentId: string, title: string) => {
    try {
      const result = await onDeleteDocument(documentId);
      if (result.success !== false) {
        toast({
          title: "Document deleted",
          description: `"${title}" has been removed successfully.`,
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete document.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "An error occurred while deleting the document.",
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
              <Skeleton className="h-4 w-1/2" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <h3 className="font-medium text-sm truncate" title={document.title || "Untitled"}>
                  {document.title || "Untitled Document"}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(document.id, document.title || "Untitled")}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {document.created_at && (
              <p className="text-xs text-muted-foreground">
                {new Date(document.created_at).toLocaleDateString()}
              </p>
            )}
            
            {document.contents && document.contents.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {document.contents.length} chunk{document.contents.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentsGrid;
