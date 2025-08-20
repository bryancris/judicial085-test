
import React from "react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { DocumentWithContent } from "@/types/knowledge";
import { FileText, FileIcon, File } from "lucide-react";
import { getDocumentType } from "@/utils/documentTypeUtils";

interface DocumentCardContentProps {
  document: DocumentWithContent;
  searchTerm?: string;
  clientSpecific?: boolean;
}

const DocumentCardContent: React.FC<DocumentCardContentProps> = ({
  document,
  searchTerm = "",
  clientSpecific = false
}) => {
  // Extract document content for display
  const content = document.contents?.[0]?.content || "";
  // Detect document type
  const docType = getDocumentType(document);
  const isPdf = docType === 'pdf';
  const isDocx = docType === 'docx';
  
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

  return (
    <>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {isPdf ? (
              <FileIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            ) : isDocx ? (
              <File className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
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
        </div>
        
        <div className="mt-2">
          {isPdf ? (
            <div className="text-gray-600 text-sm italic flex items-center">
              <FileIcon className="h-4 w-4 mr-1 text-red-500" />
              PDF Document - Click to preview
            </div>
          ) : isDocx ? (
            <div className="text-gray-600 text-sm italic flex items-center">
              <File className="h-4 w-4 mr-1 text-blue-600" />
              Word Document - Click to download
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
    </>
  );
};

export default DocumentCardContent;
