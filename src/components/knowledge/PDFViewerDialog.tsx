import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentWithContent } from "@/types/knowledge";
import { FileIcon, Download, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfRenderMethod, setPdfRenderMethod] = useState<'pdfjs' | 'object' | 'newTab'>('pdfjs');

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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(false);
    console.log('PDF loaded successfully with', numPages, 'pages');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF.js failed to load:', error);
    setLoadError(true);
    // Try fallback method
    setPdfRenderMethod('object');
  };

  const handleObjectError = () => {
    console.error('Object/embed failed to load PDF, opening in new tab');
    setPdfRenderMethod('newTab');
    handleOpenInNewTab();
  };

  const handleRetry = () => {
    setLoadError(false);
    setRetryCount(prev => prev + 1);
    setDialogKey(prev => prev + 1);
    setPdfRenderMethod('pdfjs'); // Reset to PDF.js first
    
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
            ) : loadError && pdfRenderMethod === 'pdfjs' ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to display the PDF using the built-in viewer. Trying alternative methods...
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
                {pdfRenderMethod === 'pdfjs' ? (
                  <div className="flex-1 overflow-auto bg-gray-100">
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading PDF...</p>
                          </div>
                        </div>
                      }
                      className="flex flex-col items-center"
                    >
                      <div className="mb-4 flex items-center gap-2 bg-white p-2 rounded shadow-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm font-medium px-2">
                          Page {currentPage} of {numPages || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(numPages || 1, currentPage + 1))}
                          disabled={currentPage >= (numPages || 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Page
                        pageNumber={currentPage}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg mb-4 border"
                        width={Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 100 : 800)}
                      />
                    </Document>
                  </div>
                ) : pdfRenderMethod === 'object' ? (
                  <div className="flex-1 overflow-hidden">
                    <object 
                      key={`pdf-${retryCount}-${dialogKey}`}
                      data={pdfUrl}
                      type="application/pdf"
                      className="w-full h-full border-0"
                      title="PDF Document"
                      onError={handleObjectError}
                    >
                      <embed
                        src={pdfUrl}
                        type="application/pdf"
                        className="w-full h-full border-0"
                        title="PDF Document"
                        onError={handleObjectError}
                      />
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">Cannot display PDF in browser</p>
                          <Button onClick={handleOpenInNewTab} variant="default">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                    </object>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <FileIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">PDF opened in new tab</p>
                      <Button onClick={() => setPdfRenderMethod('pdfjs')} variant="outline">
                        Try Viewing Here Again
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="p-4 bg-background border-t flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {pdfRenderMethod === 'pdfjs' && numPages ? `PDF Viewer • ${numPages} pages` : `PDF Viewer • Document ${document.id}`}
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