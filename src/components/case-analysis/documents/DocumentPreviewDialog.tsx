
import React from 'react';
import { DocumentWithContent } from "@/types/knowledge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FileText, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';

interface DocumentPreviewDialogProps {
  selectedDocument: DocumentWithContent | null;
  onClose: () => void;
  documentContent: string;
  loadingContent: boolean;
}

const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  selectedDocument,
  onClose,
  documentContent,
  loadingContent
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  if (!selectedDocument) return null;

  // Extract processing metadata from document
  const getProcessingInfo = () => {
    const metadata = selectedDocument.contents?.[0]?.metadata || {};
    return {
      processingStatus: metadata.processingStatus || 'unknown',
      extractionMethod: metadata.extractionMethod || 'unknown',
      quality: metadata.quality,
      confidence: metadata.confidence,
      pageCount: metadata.pageCount,
      isScanned: metadata.isScanned,
      processingNotes: metadata.processingNotes,
      fileName: metadata.fileName,
      fileSize: metadata.fileSize
    };
  };

  const processingInfo = getProcessingInfo();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getProcessingMethodBadge = (method: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      'enhanced-ocr-extraction': { label: 'OCR', className: 'bg-blue-100 text-blue-800' },
      'pdf-extraction': { label: 'PDF Text', className: 'bg-green-100 text-green-800' },
      'placeholder-fallback': { label: 'Fallback', className: 'bg-yellow-100 text-yellow-800' },
      'unknown': { label: 'Unknown', className: 'bg-gray-100 text-gray-800' }
    };
    
    const variant = variants[method] || variants.unknown;
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  };
  
  return (
    <Dialog open={!!selectedDocument} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Document Preview: {selectedDocument.title || "Untitled Document"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-muted-foreground">{formatDate(selectedDocument.created_at)}</span>
          {selectedDocument.case_id && (
            <Badge variant="outline">Case Document</Badge>
          )}
          {getProcessingMethodBadge(processingInfo.extractionMethod)}
          <div className="flex items-center gap-1">
            {getStatusIcon(processingInfo.processingStatus)}
            <span className="text-sm capitalize">{processingInfo.processingStatus}</span>
          </div>
        </div>

        <Tabs defaultValue="content" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Extracted Content</TabsTrigger>
            <TabsTrigger value="details">Processing Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(85vh-200px)]">
              {loadingContent ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Loading document content...</p>
                </div>
              ) : (
                <div className="p-4 whitespace-pre-wrap font-mono text-sm bg-muted/20 rounded-md">
                  {documentContent || "No content extracted"}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="details" className="flex-grow overflow-hidden">
            <ScrollArea className="h-[calc(85vh-200px)]">
              <div className="space-y-4 p-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">File Name:</span>
                      <span>{processingInfo.fileName || 'Unknown'}</span>
                      <span className="text-muted-foreground">File Size:</span>
                      <span>{processingInfo.fileSize || 'Unknown'}</span>
                      <span className="text-muted-foreground">Pages:</span>
                      <span>{processingInfo.pageCount || 'Unknown'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Processing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Method:</span>
                      <span>{processingInfo.extractionMethod}</span>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="capitalize">{processingInfo.processingStatus}</span>
                      <span className="text-muted-foreground">Scanned Document:</span>
                      <span>{processingInfo.isScanned ? 'Yes' : 'No'}</span>
                      {processingInfo.quality && (
                        <>
                          <span className="text-muted-foreground">Quality Score:</span>
                          <span>{(processingInfo.quality * 100).toFixed(1)}%</span>
                        </>
                      )}
                      {processingInfo.confidence && (
                        <>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span>{(processingInfo.confidence * 100).toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {processingInfo.processingNotes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Processing Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="whitespace-pre-wrap bg-muted/20 p-3 rounded-md">
                        {processingInfo.processingNotes}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Troubleshooting</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2 text-muted-foreground">
                    {processingInfo.extractionMethod === 'placeholder-fallback' && (
                      <p>• This document failed to process. Try re-uploading or ensure it's a valid PDF.</p>
                    )}
                    {processingInfo.isScanned && processingInfo.quality && processingInfo.quality < 0.5 && (
                      <p>• Low quality OCR result. Consider scanning at higher resolution or splitting large documents.</p>
                    )}
                    {!processingInfo.isScanned && processingInfo.extractionMethod === 'enhanced-ocr-extraction' && (
                      <p>• OCR was used but document may not be scanned. Check if text extraction is working properly.</p>
                    )}
                    <p>• For large documents, only a portion may be processed to manage costs.</p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
