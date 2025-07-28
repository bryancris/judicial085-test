import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Scale, FileText, Search } from "lucide-react";
import { CitationDetails } from "@/utils/api/citationResolutionService";

interface QuickConsultCitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citationDetails: CitationDetails | null;
}

const QuickConsultCitationModal: React.FC<QuickConsultCitationModalProps> = ({
  open,
  onOpenChange,
  citationDetails
}) => {
  if (!citationDetails) return null;

  const getSourceInfo = () => {
    switch (citationDetails.source) {
      case "courtlistener":
        return {
          icon: <Scale className="h-4 w-4" />,
          label: "Court Opinion",
          description: "Verified court decision from CourtListener",
          color: "blue"
        };
      case "knowledge_base":
        return {
          icon: <FileText className="h-4 w-4" />,
          label: "Legal Document",
          description: "Document from firm knowledge base",
          color: "green"
        };
      case "perplexity":
        return {
          icon: <Search className="h-4 w-4" />,
          label: "AI Legal Research",
          description: "Research analysis powered by Perplexity AI",
          color: "purple"
        };
      default:
        return {
          icon: <Scale className="h-4 w-4" />,
          label: "Legal Citation",
          description: "Legal reference",
          color: "gray"
        };
    }
  };

  const getConfidenceBadge = () => {
    const confidenceClass = `confidence-${citationDetails.confidence}`;
    return (
      <Badge className={`${confidenceClass} text-xs`}>
        {citationDetails.confidence.toUpperCase()} CONFIDENCE
      </Badge>
    );
  };

  const sourceInfo = getSourceInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-left">
                {citationDetails.caseName}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {citationDetails.citation}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {getConfidenceBadge()}
              <Badge variant="outline" className="flex items-center gap-1">
                {sourceInfo.icon}
                {sourceInfo.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Case Details */}
            {(citationDetails.court || citationDetails.year) && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Case Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {citationDetails.court && (
                    <div>
                      <span className="text-muted-foreground">Court:</span>
                      <div className="font-medium">{citationDetails.court}</div>
                    </div>
                  )}
                  {citationDetails.year && (
                    <div>
                      <span className="text-muted-foreground">Year:</span>
                      <div className="font-medium">{citationDetails.year}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {citationDetails.summary && (
              <div>
                <h4 className="font-medium text-sm mb-2">Summary</h4>
                <div className="bg-background border rounded-lg p-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {citationDetails.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Relevant Excerpts */}
            {citationDetails.relevantExcerpts && citationDetails.relevantExcerpts.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Relevant References</h4>
                <div className="space-y-2">
                  {citationDetails.relevantExcerpts.map((excerpt, index) => (
                    <div key={index} className="bg-background border rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">{excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Text Link */}
            {citationDetails.url && (
              <div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">View Full Document</p>
                    <p className="text-xs text-muted-foreground">{sourceInfo.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(citationDetails.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default QuickConsultCitationModal;