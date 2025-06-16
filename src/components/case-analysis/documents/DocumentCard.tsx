import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  document: DocumentWithContent;
  onDocumentOpen: (document: DocumentWithContent) => void;
  onPdfOpen: (url: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onToggleAnalysis: (documentId: string, includeInAnalysis: boolean) => void;
  isProcessing: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDocumentOpen,
  onPdfOpen,
  onDeleteDocument,
  onToggleAnalysis,
  isProcessing
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const getDocumentPreview = (document: DocumentWithContent): string => {
    if (document.contents.length > 0 && document.contents[0].content) {
      return document.contents[0].content;
    }
    return "Processing... Content will be available shortly.";
  };

  const handleToggleAnalysis = (checked: boolean) => {
    console.log(`DocumentCard: Toggling document ${document.id} analysis to: ${checked}`);
    onToggleAnalysis(document.id, checked);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteDocument(document.id);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      // Keep the deleting state for a moment to show feedback
      setTimeout(() => setIsDeleting(false), 1000);
    }
  };

  // Ensure we have a boolean value for the switch
  const isIncludedInAnalysis = Boolean(document.include_in_analysis);

  return (
    <Card className={cn(
      "col-span-1 overflow-hidden transition-all duration-200",
      isDeleting && "opacity-50 scale-95"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium truncate">
          {document.title || "Untitled Document"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 mb-3">
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
      <CardFooter className="flex flex-col gap-3 pt-2">
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => onDocumentOpen(document)}
              disabled={isDeleting}
            >
              <FileText className="h-4 w-4 mr-1" />
              View Data
            </Button>
            {document.url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPdfOpen(document.url!)}
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
            onClick={handleDelete}
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
  );
};

export default DocumentCard;
