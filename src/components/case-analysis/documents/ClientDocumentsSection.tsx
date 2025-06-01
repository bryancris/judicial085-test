import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, FileText, Trash2, PlusCircle, BookText } from "lucide-react";
import DocumentUploadDialog from "@/components/clients/DocumentUploadDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Case } from "@/types/case";
import { supabase } from '@/integrations/supabase/client';

interface ClientDocumentsSectionProps {
  clientId: string;
  documents: DocumentWithContent[];
  isLoading: boolean;
  onProcessDocument: (title: string, content: string, metadata?: any) => Promise<any>;
  onDeleteDocument: (documentId: string) => Promise<any>;
  isProcessing: boolean;
  fullView?: boolean;
  caseId?: string;
  caseName?: string;
  cases?: Case[];
  allowCaseSelection?: boolean;
  onRefreshDocuments?: () => void; // Add callback to refresh documents
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

  const renderDocumentSkeletons = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`skeleton-${index}`} className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </>
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  const getDocumentPreview = (document: DocumentWithContent): string => {
    if (document.contents.length > 0 && document.contents[0].content) {
      return document.contents[0].content;
    }
    return "Processing... Content will be available shortly.";
  };

  const renderDocumentPreview = () => {
    if (!selectedDocument) return null;
    
    return (
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument.title || "Document"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span>{formatDate(selectedDocument.created_at)}</span>
            {selectedDocument.case_id && (
              <Badge variant="outline" className="ml-2">
                Case Document
              </Badge>
            )}
          </div>
          
          <ScrollArea className="flex-grow max-h-[calc(80vh-120px)]">
            {loadingContent ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading document content...</p>
              </div>
            ) : (
              <div className="p-4 whitespace-pre-wrap font-mono text-sm">
                {documentContent}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            renderDocumentSkeletons()
          ) : documents.length === 0 ? (
            <div className="col-span-full p-8 text-center border rounded-lg bg-muted/30">
              <h3 className="text-xl font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground mb-4">
                {caseId 
                  ? "This case doesn't have any documents yet." 
                  : "You haven't uploaded any documents for this client yet."}
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {caseId ? "Add Case Document" : "Add Document"}
              </Button>
            </div>
          ) : (
            <>
              {sortedDocuments.map((document) => (
                <Card key={document.id} className="col-span-1 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium truncate">
                      {document.title || "Untitled Document"}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(document.created_at)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 mb-3">
                      {document.schema === 'client_document' ? (
                        <Badge variant="secondary">Client</Badge>
                      ) : document.schema === 'case_document' ? (
                        <Badge variant="secondary">Case</Badge>
                      ) : (
                        <Badge variant="outline">Document</Badge>
                      )}
                      
                      {document.case_id && (
                        <Badge variant="outline">Case Document</Badge>
                      )}
                      
                      {document.url && (
                        <Badge variant="outline">
                          <FileText className="h-3 w-3 mr-1" /> PDF
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {getDocumentPreview(document)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleDocumentOpen(document)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(document.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="h-4 w-4 text-destructive-foreground" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </>
          )}
        </div>

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

        {renderDocumentPreview()}
      </div>
    </>
  );
};

export default ClientDocumentsSection;
