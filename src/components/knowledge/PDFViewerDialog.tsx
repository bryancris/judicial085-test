import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileIcon, Download, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface PDFViewerDialogProps {
  document: DocumentWithContent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PDFViewerDialog: React.FC<PDFViewerDialogProps> = ({
  document,
  isOpen,
  onOpenChange
}) => {
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [dialogKey, setDialogKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingBlob, setIsLoadingBlob] = useState(false);

  // EMERGENCY FIX: Fetch PDF as blob to bypass all caching
  const fetchPdfAsBlob = async () => {
    if (!document.url) return null;
    
    setIsLoadingBlob(true);
    try {
      console.log('Fetching PDF as blob from:', document.url);
      
      const response = await fetch(document.url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('PDF arrayBuffer size:', arrayBuffer.byteLength);
      
      // Create blob with explicit PDF MIME type
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      console.log('PDF blob type:', blob.type, 'size:', blob.size);
      
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
      setLoadError(false);
      return objectUrl;
    } catch (error) {
      console.error('Error fetching PDF blob:', error);
      setLoadError(true);
      return null;
    } finally {
      setIsLoadingBlob(false);
    }
  };

  // Fetch blob when dialog opens or document changes
  useEffect(() => {
    if (isOpen && document.url && !blobUrl) {
      fetchPdfAsBlob();
    }
    
    // Cleanup blob URL when dialog closes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
  }, [isOpen, document.url]);

  const pdfUrl = blobUrl || document.url;
  
  // Debug logging to see what URL we're actually using
  console.log('PDFViewerDialog - Document:', {
    id: document.id,
    title: document.title,
    url: document.url,
    pdfUrl
  });

  const handleIframeError = () => {
    setLoadError(true);
    console.error('PDF iframe failed to load:', pdfUrl);
  };

  const handleRetry = () => {
    setLoadError(false);
    setRetryCount(prev => prev + 1);
    setDialogKey(prev => prev + 1);
    
    // Clear existing blob and fetch new one
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    
    fetchPdfAsBlob();
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = window.document.createElement('a');
      link.href = pdfUrl;
      link.download = `${document.id}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog key={dialogKey} open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-background border-b">
          <DialogTitle className="flex items-center">
            <FileIcon className="h-5 w-5 text-red-500 mr-2" />
            PDF Document
          </DialogTitle>
        </DialogHeader>
        
        {pdfUrl || isLoadingBlob ? (
          <div className="flex flex-col h-[75vh]">
            {isLoadingBlob ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              </div>
            ) : loadError ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to display the PDF in the browser. This might be due to browser security settings or PDF format compatibility.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <Button onClick={handleRetry} variant="outline" className="w-full">
                      Try Again
                    </Button>
                    <Button onClick={handleOpenInNewTab} variant="secondary" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </Button>
                    <Button onClick={handleDownload} variant="default" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-hidden">
                  <object 
                    key={`pdf-${retryCount}-${dialogKey}`}
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full border-0"
                    title="PDF Document"
                  >
                    <embed
                      src={pdfUrl}
                      type="application/pdf"
                      className="w-full h-full border-0"
                      title="PDF Document"
                    />
                  </object>
                </div>
                
                <div className="p-4 bg-background border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    PDF Viewer • Document {document.id}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleOpenInNewTab}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      New Tab
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">PDF Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              The PDF file could not be located. The file may have been moved or the link may be broken.
            </p>
            <p className="text-sm text-muted-foreground">Document ID: {document.id}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerDialog;