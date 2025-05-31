
import React, { useState } from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";
import DocumentUploadDialog from "@/components/clients/DocumentUploadDialog";
import DocumentsGrid from "./DocumentsGrid";
import { Button } from "@/components/ui/button";
import { FilePlus, RefreshCw } from "lucide-react";
import { Case } from "@/types/case";
import { useDocumentChange } from "@/contexts/DocumentChangeContext";

interface ClientDocumentsSectionProps {
  clientId: string;
  documents: DocumentWithContent[];
  isLoading: boolean;
  onProcessDocument: ProcessDocumentContentFunction;
  onDeleteDocument: (documentId: string) => Promise<any>;
  isProcessing: boolean;
  fullView?: boolean;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
  allowCaseSelection?: boolean;
  onRefreshDocuments?: () => void;
}

const ClientDocumentsSection: React.FC<ClientDocumentsSectionProps> = ({
  clientId,
  documents,
  isLoading,
  onProcessDocument,
  onDeleteDocument,
  isProcessing,
  fullView = false,
  caseId,
  caseName,
  cases = [],
  allowCaseSelection = false,
  onRefreshDocuments
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { notifyDocumentChange } = useDocumentChange();

  const handleUploadSuccess = () => {
    console.log("Document upload successful, notifying change...");
    notifyDocumentChange();
    if (onRefreshDocuments) {
      onRefreshDocuments();
    }
  };

  const handleDeleteSuccess = async (documentId: string) => {
    const result = await onDeleteDocument(documentId);
    if (result.success !== false) {
      console.log("Document delete successful, notifying change...");
      notifyDocumentChange();
      if (onRefreshDocuments) {
        onRefreshDocuments();
      }
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {fullView && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={isProcessing}
            >
              <FilePlus className="h-4 w-4" />
              Add Document
            </Button>
            
            {onRefreshDocuments && (
              <Button
                onClick={onRefreshDocuments}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      )}

      <DocumentsGrid
        documents={documents}
        isLoading={isLoading}
        onDeleteDocument={handleDeleteSuccess}
        fullView={fullView}
      />

      <DocumentUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={onProcessDocument}
        isProcessing={isProcessing}
        clientId={clientId}
        caseId={caseId}
        caseName={caseName}
        cases={cases}
        allowCaseSelection={allowCaseSelection}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default ClientDocumentsSection;
