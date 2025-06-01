
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { DocumentWithContent } from "@/types/knowledge";
import { cn } from "@/lib/utils";
import DocumentCardContent from "./DocumentCardContent";
import DocumentCardActions from "./DocumentCardActions";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";

interface DocumentCardProps {
  document: DocumentWithContent;
  searchTerm?: string;
  clientSpecific?: boolean;
  onDelete?: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  isDeleting?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  searchTerm = "",
  clientSpecific = false,
  onDelete,
  isDeleting = false
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localIsDeleting, setLocalIsDeleting] = useState(false);

  // Handle card click (prevents opening preview when clicking on buttons)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open preview if clicked on a button or interactive element
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPreviewOpen(true);
  };

  const handleDeleteClick = () => {
    console.log("DocumentCard handleDeleteClick called for document:", document.id);
    setDeleteDialogOpen(true);
  };

  // Debug logging
  console.log("DocumentCard render:", {
    documentId: document.id,
    hasOnDelete: !!onDelete,
    deleteDialogOpen,
    isDeleting,
    localIsDeleting
  });

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow relative group",
          (isDeleting || localIsDeleting) && "opacity-50"
        )}
        onClick={handleCardClick}
      >
        <DocumentCardActions
          document={document}
          onDelete={onDelete}
          isDeleting={isDeleting || localIsDeleting}
          onDeleteClick={handleDeleteClick}
        />
        
        <DocumentCardContent
          document={document}
          searchTerm={searchTerm}
          clientSpecific={clientSpecific}
        />
      </Card>

      <DocumentPreviewDialog
        document={document}
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <DocumentDeleteDialog
        document={document}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={onDelete}
        isDeleting={isDeleting || localIsDeleting}
      />
    </>
  );
};

export default DocumentCard;
