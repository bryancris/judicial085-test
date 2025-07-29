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
import { ExternalLink, Scale, FileText, Search, AlertCircle, Globe } from "lucide-react";
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
            {(citationDetails.court || citationDetails.year || citationDetails.docketNumber) && (
              <div className="bg-secondary/30 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">Case Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {citationDetails.docketNumber && (
                    <div>
                      <span className="text-muted-foreground">Docket Number:</span>
                      <div className="font-medium">{citationDetails.docketNumber}</div>
                    </div>
                  )}
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

            {/* Document Access Section */}
            <Separator className="my-4" />
            
            {/* Show warning for AI analysis */}
            {!citationDetails.hasActualDocument && citationDetails.source === "perplexity" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">AI Analysis</p>
                    <p className="text-xs text-yellow-700">
                      This is an AI-generated analysis, not the original case document. 
                      Use the search links below to find the actual case.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Document Access */}
            {citationDetails.url && citationDetails.hasActualDocument && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Original Document Available</p>
                    <p className="text-xs text-green-700">{sourceInfo.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(citationDetails.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Case Document
                  </Button>
                </div>
              </div>
            )}

            {/* Alternative Search Options */}
            {citationDetails.alternativeSearchUrls && citationDetails.alternativeSearchUrls.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Search for Original Case
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {citationDetails.alternativeSearchUrls.map((searchUrl, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(searchUrl.url, '_blank')}
                      className="flex items-center gap-2 justify-start text-xs"
                    >
                      <Search className="h-3 w-3" />
                      {searchUrl.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click any search option above to find the original case document
                </p>
              </div>
            )}

            {/* Show AI analysis if no document but has content */}
            {citationDetails.url && !citationDetails.hasActualDocument && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(citationDetails.url, '_blank')}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Search className="h-3 w-3" />
                  View AI Analysis
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default QuickConsultCitationModal;