
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { Loader2, PlusCircle, BookText } from "lucide-react";
import DocumentUploadDialog from "@/components/clients/DocumentUploadDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Case } from "@/types/case";
import { supabase } from '@/integrations/supabase/client';
import DocumentGrid from './DocumentGrid';
import DocumentPreviewDialog from './DocumentPreviewDialog';

interface ClientDocumentsSectionProps {
  clientId: string;
  documents: DocumentWithContent[];
  isLoading: boolean;
  onProcessDocument: (title: string, content: string, metadata?: any) => Promise<any>;
  onDeleteDocument: (documentId: string) => Promise<any>;
  onToggleDocumentAnalysis: (documentId: string, includeInAnalysis: boolean) => Promise<any>;
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
  onToggleDocumentAnalysis,
  isProcessing,
  fullView = false,
  caseId,
  caseName,
  cases = [],
  allowCaseSelection = false,
  onRefreshDocuments
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithContent | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  const handleDocumentOpen = async (document: DocumentWithContent) => {
    setSelectedDocument(document);
    setLoadingContent(true);
    
    try {
      // First try to get content from document chunks
      const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('content')
        .eq('document_id', document.id)
        .order('chunk_index');
      
      if (!error && chunks && chunks.length > 0) {
        const fullContent = chunks.map(chunk => chunk.content).join('\n\n');
        setDocumentContent(fullContent);
      } else {
        // Fallback to existing content
        const existingContent = document.contents.map(item => item.content).join('\n\n');
        setDocumentContent(existingContent || 'No content available');
      }
    } catch (error) {
      console.error('Error loading document content:', error);
      setDocumentContent('Error loading content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handlePdfOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDocumentUpload = async (title: string, content: string, file?: File, metadata?: any) => {
    try {
      await onProcessDocument(title, content, { 
        isPdfDocument: !!file, 
        caseId: metadata?.caseId || caseId,
        ...metadata 
      });
      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Error processing document:", error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await onDeleteDocument(documentId);
      // Trigger refresh after successful deletion
      if (onRefreshDocuments) {
        onRefreshDocuments();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleToggleAnalysis = async (documentId: string, includeInAnalysis: boolean) => {
    try {
      await onToggleDocumentAnalysis(documentId, includeInAnalysis);
    } catch (error) {
      console.error("Error toggling document analysis:", error);
    }
  };

  const handleUploadSuccess = () => {
    console.log("Document upload successful, triggering refresh...");
    // Trigger refresh after successful upload
    if (onRefreshDocuments) {
      // Add small delay to ensure backend processing is complete
      setTimeout(() => {
        onRefreshDocuments();
      }, 1000);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {caseId && caseName && (
          <Alert variant="default" className="bg-muted/50">
            <AlertTitle className="flex items-center">
              <BookText className="h-4 w-4 mr-2" />
              Case Documents
            </AlertTitle>
            <AlertDescription>
              Showing documents for case: <strong>{caseName}</strong>
            </AlertDescription>
          </Alert>
        )}
        
        <DocumentGrid
          documents={documents}
          isLoading={isLoading}
          caseId={caseId}
          onDocumentOpen={handleDocumentOpen}
          onPdfOpen={handlePdfOpen}
          onDeleteDocument={handleDeleteDocument}
          onToggleAnalysis={handleToggleAnalysis}
          onUploadClick={() => setUploadDialogOpen(true)}
          isProcessing={isProcessing}
        />

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {caseId 
              ? "Add Case Document" 
              : "Add Client Document"}
          </Button>
        </div>

        <DocumentUploadDialog
          isOpen={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUpload={handleDocumentUpload}
          isProcessing={isProcessing}
          clientId={clientId}
          caseId={caseId}
          caseName={caseName}
          cases={cases}
          allowCaseSelection={allowCaseSelection}
          onUploadSuccess={handleUploadSuccess}
        />

        <DocumentPreviewDialog
          selectedDocument={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          documentContent={documentContent}
          loadingContent={loadingContent}
        />
      </div>
    </>
  );
};

export default ClientDocumentsSection;
