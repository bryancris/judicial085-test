
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Book, ChevronDown, ChevronUp } from "lucide-react";
import { DocumentWithContent } from "@/types/knowledge";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentWithContent;
  searchTerm?: string;
  onSelect?: (document: DocumentWithContent) => void;
  clientSpecific?: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  searchTerm = "",
  onSelect,
  clientSpecific = false
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get the first few contents or all if expanded
  const visibleContents = expanded
    ? document.contents
    : document.contents.slice(0, 1);

  // Helper function to highlight search term
  const highlightText = (text: string, term: string) => {
    if (!term) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark> 
        : part
    );
  };

  // Helper function to get a preview of the document content
  const getContentPreview = (content: string) => {
    const MAX_LENGTH = 150;
    if (content && content.length > MAX_LENGTH) {
      return content.substring(0, MAX_LENGTH) + '...';
    }
    return content || 'No content available';
  };

  // Compute the proper icon based on document type
  const DocumentIcon = clientSpecific ? FileText : Book;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow overflow-hidden",
        onSelect && "cursor-pointer hover:border-primary"
      )}
      onClick={() => onSelect && onSelect(document)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center">
            <DocumentIcon className="h-5 w-5 mr-2 text-primary" />
            <span className="truncate" title={document.title || undefined}>
              {searchTerm ? highlightText(document.title || 'Untitled', searchTerm) : document.title || 'Untitled'}
            </span>
          </div>
          {document.contents.length > 1 && (
            <Button
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="space-y-3">
          {visibleContents.map((content, idx) => (
            <div key={idx} className="text-gray-700">
              {searchTerm 
                ? highlightText(getContentPreview(content.content || ''), searchTerm) 
                : getContentPreview(content.content || '')
              }
            </div>
          ))}
          
          {!expanded && document.contents.length > 1 && (
            <div className="text-xs text-gray-500 italic">
              {document.contents.length - 1} more {document.contents.length === 2 ? 'section' : 'sections'}...
            </div>
          )}
          
          {clientSpecific && document.contents.length === 0 && (
            <div className="text-xs text-gray-500 italic">
              Processing document...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
