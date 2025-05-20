
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DocumentWithContent } from "@/types/knowledge";
import { FileText, Download, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentWithContent;
  searchTerm?: string;
  clientSpecific?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  searchTerm = "",
  clientSpecific = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Extract document content for display
  const content = document.contents?.[0]?.content || "";
  // Check if this is a PDF document
  const isPdf = document.contents?.[0]?.metadata?.isPdfDocument || document.contents?.[0]?.metadata?.fileType === "pdf";
  // Get PDF URL if available
  const pdfUrl = document.contents?.[0]?.metadata?.pdfUrl || "";
  
  // Truncate content for display
  const truncatedContent = content.length > 150 
    ? `${content.substring(0, 150)}...` 
    : content;
  
  // Highlight search term if present
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm || searchTerm.length < 3) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // Handle PDF download
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow"
        onClick={() => setPreviewOpen(true)}
      >
        <CardContent className="p-4 flex-grow">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {isPdf ? (
                <FileIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              )}
              <h3 
                className="font-medium text-lg line-clamp-2" 
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchTerm(document.title || "Untitled Document") 
                }}
              />
            </div>
            {isPdf && pdfUrl && (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleDownload}
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-2">
            {isPdf ? (
              <div className="text-gray-600 text-sm italic flex items-center">
                <FileIcon className="h-4 w-4 mr-1 text-red-500" />
                PDF Document - Click to preview
              </div>
            ) : (
              <p 
                className="text-gray-600 text-sm line-clamp-3 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchTerm(truncatedContent) 
                }}
              />
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 text-xs text-gray-500 flex justify-between">
          <span>{new Date(document.created_at || "").toLocaleDateString()}</span>
          {clientSpecific && (
            <span>Client Document</span>
          )}
        </CardFooter>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className={cn("max-w-4xl max-h-[85vh]", isPdf ? "p-0 overflow-hidden" : "")}>
          <DialogHeader className={isPdf ? "p-4 bg-white border-b" : ""}>
            <DialogTitle className="flex items-center">
              {isPdf ? (
                <FileIcon className="h-5 w-5 text-red-500 mr-2" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
              )}
              {document.title || "Untitled Document"}
            </DialogTitle>
          </DialogHeader>
          
          {isPdf && pdfUrl ? (
            <div className="h-[70vh] overflow-hidden">
              <iframe 
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full"
                title={document.title || "PDF Document"}
              />
              <div className="p-4 bg-white border-t flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] whitespace-pre-wrap">
              {document.contents.map((contentItem, i) => (
                <p key={i} className="mb-4">{contentItem.content}</p>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentCard;
