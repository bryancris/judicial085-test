
import React from "react";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, FileIcon, Eye } from "lucide-react";

interface DocumentCardProps {
  document: DocumentWithContent;
  onView: (document: DocumentWithContent) => void;
  onDelete: (document: DocumentWithContent) => void;
  onViewPdf: (document: DocumentWithContent) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
  onViewPdf
}) => {
  // Improved PDF detection function
  const isPdfDocument = (document: DocumentWithContent): boolean => {
    console.log('Checking if PDF for document:', document.title);
    
    // Check document title for .pdf extension (most reliable)
    const titleIsPdf = document.title?.toLowerCase().endsWith('.pdf');
    
    // Check document schema
    const schemaIsPdf = document.schema === 'pdf';
    
    // Check content metadata for various PDF indicators
    const contentMetadata = document.contents?.[0]?.metadata;
    const contentIsPdf = contentMetadata?.isPdfDocument === true ||
      contentMetadata?.blobType === 'application/pdf' ||
      contentMetadata?.file_type === "pdf";
    
    // Check document URL for PDF indicators
    const urlIsPdf = document.url?.includes('drive.google.com') || 
                    document.url?.toLowerCase().includes('.pdf');
    
    const isPdf = titleIsPdf || schemaIsPdf || contentIsPdf || urlIsPdf;
    
    console.log('PDF detection results:', {
      titleIsPdf,
      schemaIsPdf,
      contentIsPdf,
      urlIsPdf,
      finalResult: isPdf
    });
    
    return isPdf;
  };

  // Helper function to get PDF URL
  const getPdfUrl = (document: DocumentWithContent): string | null => {
    // Check various locations for PDF URL
    const possibleUrls = [
      document.url,
      document.contents?.[0]?.metadata?.pdfUrl,
      document.contents?.[0]?.metadata?.pdf_url,
      document.contents?.[0]?.metadata?.file_path,
      document.contents?.[0]?.metadata?.url
    ];
    
    const pdfUrl = possibleUrls.find(url => url && typeof url === 'string' && url.trim().length > 0);
    
    console.log('Selected PDF URL:', pdfUrl);
    return pdfUrl || null;
  };

  // Improved document content retrieval
  const getDocumentContent = (document: DocumentWithContent): string => {
    console.log('Getting content for document:', document.title);
    
    if (!document.contents || document.contents.length === 0) {
      console.log('No contents array found');
      return "No content available for this document.";
    }
    
    // Get content from the first content item
    const content = document.contents[0]?.content;
    
    console.log('Raw content:', content?.substring(0, 100) + '...');
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return "Document content could not be extracted or is empty.";
    }
    
    return content;
  };

  const isPdf = isPdfDocument(document);
  const pdfUrl = getPdfUrl(document);
  const content = getDocumentContent(document);
  const truncatedContent = content.length > 150 
    ? `${content.substring(0, 150)}...` 
    : content;

  console.log(`Rendering document ${document.id}: isPdf=${isPdf}, hasContent=${content.length > 0}, pdfUrl=${pdfUrl}`);

  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {isPdf ? (
              <FileIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
            )}
            <h3 className="font-medium text-sm truncate" title={document.title || "Untitled"}>
              {document.title || "Untitled Document"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(document)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-3">
          {isPdf ? (
            <div className="text-gray-600 text-sm italic flex items-center">
              <FileIcon className="h-4 w-4 mr-1 text-red-500" />
              PDF Document
              {pdfUrl && (
                <span className="ml-2 text-green-600">• View available</span>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-sm line-clamp-3 whitespace-pre-wrap">
              {truncatedContent}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{new Date(document.created_at || "").toLocaleDateString()}</span>
          {document.contents && document.contents.length > 0 && (
            <span>{document.contents.length} chunk{document.contents.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document)}
            className="flex-1 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Content
          </Button>
          
          {isPdf && pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPdf(document)}
              className="flex items-center gap-2"
              title="View original PDF file"
            >
              <FileIcon className="h-4 w-4" />
              View PDF
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
