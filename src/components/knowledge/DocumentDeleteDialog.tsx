
import React, { useState } from "react";
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
import { DocumentWithContent } from "@/types/knowledge";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentDeleteDialogProps {
  document: DocumentWithContent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting?: boolean;
}

const DocumentDeleteDialog: React.FC<DocumentDeleteDialogProps> = ({
  document,
  isOpen,
  onOpenChange,
  onDelete,
  isDeleting = false
}) => {
  const [localIsDeleting, setLocalIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle document delete with improved error handling
  const handleDelete = async () => {
    if (!onDelete || !document.id) {
      setDeleteError("Cannot delete this document: Invalid document or missing delete handler");
      return;
    }
    
    setLocalIsDeleting(true);
    setDeleteError(null);
    
    try {
      console.log(`DocumentDeleteDialog: Initiating delete for document ${document.id}`);
      
      // Call the delete handler and wait for the result
      const result = await onDelete(document.id);
      
      console.log(`DocumentDeleteDialog: Delete result for document ${document.id}:`, result);
      
      if (result.success) {
        // Only close the dialog if deletion was truly successful
        onOpenChange(false);
        toast({
          title: "Document deleted",
          description: "Document was successfully deleted",
        });
      } else {
        // If there was an error message in the result, display it
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

  // Combined deleting state (from props or local)
  const isCurrentlyDeleting = isDeleting || localIsDeleting;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      // Only allow closing if we're not in the middle of deleting
      if (!isCurrentlyDeleting) {
        onOpenChange(open);
        if (!open) {
          setDeleteError(null);
        }
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{document.title || "Untitled Document"}"?
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
          <AlertDialogCancel disabled={isCurrentlyDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isCurrentlyDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCurrentlyDeleting ? (
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
  );
};

export default DocumentDeleteDialog;
