import React, { useState } from 'react';
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
  allowCaseSelection = false
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithContent | null>(null);

  const handleDocumentOpen = (document: DocumentWithContent) => {
    setSelectedDocument(document);
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
    } catch (error) {
      console.error("Error deleting document:", error);
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

  // Format date to be more readable
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  // Sort documents by created date (newest first)
  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // Show document preview modal
  const renderDocumentPreview = () => {
    if (!selectedDocument) return null;
    
    const documentContent = selectedDocument.contents.map(item => item.content).join("\n\n");
    
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
            <div className="p-4 whitespace-pre-wrap font-mono text-sm">
              {documentContent || "No content available"}
            </div>
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
                      {document.contents.length > 0
                        ? document.contents[0].content
                        : "No preview available"}
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
        />

        {renderDocumentPreview()}
      </div>
    </>
  );
};

export default ClientDocumentsSection;
