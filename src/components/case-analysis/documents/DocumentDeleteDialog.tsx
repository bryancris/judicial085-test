
import React from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
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

interface DocumentDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentWithContent | null;
  onConfirmDelete: (document: DocumentWithContent) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

const DocumentDeleteDialog: React.FC<DocumentDeleteDialogProps> = ({
  isOpen,
  onClose,
  document,
  onConfirmDelete,
  isDeleting,
  error
}) => {
  const handleClose = (open: boolean) => {
    if (!isDeleting) {
      if (!open) {
        onClose();
      }
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (document) {
      onConfirmDelete(document);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{document?.title || "Untitled Document"}"?
            This action cannot be undone and will permanently remove the document and all its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-3 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
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
