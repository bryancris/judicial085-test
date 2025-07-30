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
  caseName?: string;
  aiSummary?: string;
  citationType?: 'case' | 'statute' | 'section' | 'docket' | 'unknown';
}

const QuickConsultCitationLink: React.FC<QuickConsultCitationLinkProps> = ({ 
  citation, 
  className,
  caseName,
  aiSummary,
  citationType = 'unknown'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [citationDetails, setCitationDetails] = useState<CitationDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCitationClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use AI-enhanced matching for case names, fallback for docket numbers
      if (citationType === 'case' && caseName && aiSummary) {
        const result = await resolveCitationWithCache(caseName, aiSummary);
        if (result.details) {
          // Direct link to CourtListener if AI matched with high confidence
          if (result.details.courtListenerUrl && result.details.aiMatchConfidence && result.details.aiMatchConfidence >= 75) {
            window.open(result.details.courtListenerUrl, '_blank');
            setCitationDetails(result.details);
            return;
          } else {
            // Show modal for medium/low confidence matches
            setCitationDetails(result.details);
            setModalOpen(true);
            return;
          }
        }
      }

      // Fallback behavior for docket numbers or when AI matching fails
      if (citationType === 'docket' || citationType === 'unknown') {
        const docketNumber = citation.replace(/^(?:Docket|Case)\s+No\.\s+/i, '').replace(/[,.]$/, '').trim();
        const courtListenerUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(docketNumber)}&type=o&court=all`;
        window.open(courtListenerUrl, '_blank');
      } else {
        // Generic search for case names without AI context
        const searchTerm = caseName || citation;
        const courtListenerUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(searchTerm)}&type=o&court=all`;
        window.open(courtListenerUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Citation resolution error:', err);
      setError('Link failed');
      // Fallback to generic search
      const searchTerm = caseName || citation;
      const courtListenerUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(searchTerm)}&type=o&court=all`;
      window.open(courtListenerUrl, '_blank');
    } finally {
      setIsLoading(false);
    }
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