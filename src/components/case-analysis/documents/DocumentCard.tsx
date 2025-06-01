
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DocumentWithContent } from "@/types/knowledge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2, ExternalLink } from "lucide-react";
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

  // Ensure we have a boolean value for the switch
  const isIncludedInAnalysis = Boolean(document.include_in_analysis);

  return (
    <Card className="col-span-1 overflow-hidden">
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
            >
              <FileText className="h-4 w-4 mr-1" />
              View Data
            </Button>
            {document.url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPdfOpen(document.url!)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View PDF
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteDocument(document.id)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 text-destructive-foreground" />
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
            disabled={isProcessing}
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
