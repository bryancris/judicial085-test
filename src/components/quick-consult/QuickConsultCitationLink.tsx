import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Scale, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CitationDetails, resolveCitationWithCache } from "@/utils/api/citationResolutionService";
import QuickConsultCitationModal from "./QuickConsultCitationModal";

interface QuickConsultCitationLinkProps {
  citation: string;
  className?: string;
}

const QuickConsultCitationLink: React.FC<QuickConsultCitationLinkProps> = ({ 
  citation, 
  className 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [citationDetails, setCitationDetails] = useState<CitationDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCitationClick = async () => {
    // All citations are now docket numbers, extract the number and link to CourtListener
    const docketNumber = citation.replace(/^(?:Docket|Case)\s+No\.\s+/i, '').replace(/[,.]$/, '').trim();
    const courtListenerUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(docketNumber)}&type=o&court=all`;
    window.open(courtListenerUrl, '_blank');
  };

  const getSourceIcon = () => {
    // All citations are docket numbers, always use external link icon
    return <ExternalLink className="h-3 w-3" />;
  };

  const getSourceLabel = () => {
    // All citations are docket numbers, show CourtListener label
    return "CourtListener";
  };

  return (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={handleCitationClick}
        disabled={isLoading}
        className={cn(
          "h-auto p-1 text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1",
          "law-reference case", // Apply styling from references.css
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          getSourceIcon()
        )}
        <span className="underline">{citation}</span>
        <Badge variant="secondary" className="text-xs ml-1">
          {getSourceLabel()}
        </Badge>
      </Button>

      {error && (
        <span className="text-xs text-red-500 ml-1">
          ({error})
        </span>
      )}

      <QuickConsultCitationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        citationDetails={citationDetails}
      />
    </>
  );
};

export default QuickConsultCitationLink;