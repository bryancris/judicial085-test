
import React from 'react';
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { PlusCircle } from "lucide-react";
import DocumentCard from './DocumentCard';
import DocumentSkeletons from './DocumentSkeletons';

interface DocumentGridProps {
  documents: DocumentWithContent[];
  isLoading: boolean;
  caseId?: string;
  onDocumentOpen: (document: DocumentWithContent) => void;
  onPdfOpen: (url: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onToggleAnalysis: (documentId: string, includeInAnalysis: boolean) => void;
  onUploadClick: () => void;
  isProcessing: boolean;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  isLoading,
  caseId,
  onDocumentOpen,
  onPdfOpen,
  onDeleteDocument,
  onToggleAnalysis,
  onUploadClick,
  isProcessing
}) => {
  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DocumentSkeletons />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-full p-8 text-center border rounded-lg bg-muted/30">
          <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
          <p className="text-muted-foreground mb-4">
            {caseId 
              ? "This case doesn't have any documents yet." 
              : "You haven't uploaded any documents for this client yet."}
          </p>
          <Button onClick={onUploadClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {caseId ? "Add Case Document" : "Add Document"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedDocuments.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDocumentOpen={onDocumentOpen}
          onPdfOpen={onPdfOpen}
          onDeleteDocument={onDeleteDocument}
          onToggleAnalysis={onToggleAnalysis}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};

export default DocumentGrid;
