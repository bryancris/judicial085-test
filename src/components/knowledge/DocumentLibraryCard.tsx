import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2, ExternalLink, Loader2, FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DocumentPreviewDialog from "@/components/case-analysis/documents/DocumentPreviewDialog";
import DocumentDeleteDialog from "./DocumentDeleteDialog";
import PDFViewerDialog from "./PDFViewerDialog";
import { supabase } from "@/integrations/supabase/client";

interface DocumentLibraryCardProps {
  document: DocumentWithContent;
  onDeleteDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  onToggleAnalysis: (documentId: string, includeInAnalysis: boolean) => Promise<{ success: boolean; error?: string }>;
  isProcessing: boolean;
}

const DocumentLibraryCard: React.FC<DocumentLibraryCardProps> = ({
  document,
  onDeleteDocument,
  onToggleAnalysis,
  isProcessing
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  const getDocumentPreview = (document: DocumentWithContent): string => {
    if (document.contents.length > 0 && document.contents[0].content) {
      return document.contents[0].content;
    }
    return "Processing... Content will be available shortly.";
  };

  const handleToggleAnalysis = (checked: boolean) => {
    console.log(`DocumentLibraryCard: Toggling document ${document.id} analysis to: ${checked}`);
    onToggleAnalysis(document.id, checked);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const fetchDocumentContent = async () => {
    if (!document.id) return;
    
    setLoadingContent(true);
    try {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('content')
        .eq('document_id', document.id)
        .order('chunk_index');

      if (error) throw error;

      const fullContent = data?.map(chunk => chunk.content).join('\n\n') || '';
      setDocumentContent(fullContent);
    } catch (error) {
      console.error('Error fetching document content:', error);
      setDocumentContent('Error loading document content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open preview if clicking on a button or switch
    if ((e.target as HTMLElement).closest('button, [role="switch"]')) {
      return;
    }
    setShowPreview(true);
    fetchDocumentContent();
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
    fetchDocumentContent();
  };

  const handlePdfOpen = () => {
    setShowPDFViewer(true);
  };

  // Check if this is a PDF document
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || 
               document.contents?.[0]?.metadata?.fileType === "pdf" ||
               document.title?.toLowerCase().endsWith('.pdf');

  // Ensure we have a boolean value for the switch
  const isIncludedInAnalysis = Boolean(document.include_in_analysis);

  return (
    <>
      <Card 
        className={cn(
          "col-span-1 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md",
          isDeleting && "opacity-50 scale-95"
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium truncate flex items-center gap-2">
            {isPdf ? (
              <FileIcon className="h-5 w-5 text-red-500" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
            <span>{document.title || "Untitled Document"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">Firm Document</Badge>
            
            {isPdf && (
              <Badge variant="outline">
                <FileIcon className="h-3 w-3 mr-1 text-red-500" /> PDF
              </Badge>
            )}
          </div>
          
          {isPdf ? (
            <div className="text-sm text-muted-foreground italic flex items-center">
              <FileIcon className="h-4 w-4 mr-1 text-red-500" />
              PDF Document - Click to preview
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {getDocumentPreview(document)}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handlePreviewClick}
                disabled={isDeleting}
              >
                <FileText className="h-4 w-4 mr-1" />
                Preview
              </Button>
              {document.url && isPdf && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePdfOpen}
                  disabled={isDeleting}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View PDF
                </Button>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isProcessing || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[80px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between w-full text-sm">
            <label htmlFor={`analysis-${document.id}`} className="text-muted-foreground">
              Include in Analysis
            </label>
            <Switch
              id={`analysis-${document.id}`}
              checked={isIncludedInAnalysis}
              onCheckedChange={handleToggleAnalysis}
              disabled={isProcessing || isDeleting}
              className={cn(
                "data-[state=checked]:bg-green-500",
                "focus-visible:ring-green-600"
              )}
            />
          </div>
        </CardFooter>
      </Card>

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        selectedDocument={showPreview ? document : null}
        onClose={() => setShowPreview(false)}
        documentContent={documentContent}
        loadingContent={loadingContent}
      />

      {/* PDF Viewer Dialog */}
      <PDFViewerDialog
        document={document}
        isOpen={showPDFViewer}
        onOpenChange={setShowPDFViewer}
      />

      {/* Delete Dialog */}
      <DocumentDeleteDialog
        document={document}
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={onDeleteDocument}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DocumentLibraryCard;