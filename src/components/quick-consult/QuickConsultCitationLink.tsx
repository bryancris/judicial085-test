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
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Resolving citation:", citation);
      const result = await resolveCitationWithCache(citation);
      
      if (result.details) {
        setCitationDetails(result.details);
        setModalOpen(true);
      } else {
        setError(result.error || "Citation could not be resolved");
      }
    } catch (err: any) {
      console.error("Error resolving citation:", err);
      setError(err.message || "Failed to resolve citation");
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = () => {
    if (!citationDetails) return <Scale className="h-3 w-3" />;
    
    switch (citationDetails.source) {
      case "courtlistener":
        return <Scale className="h-3 w-3" />;
      case "knowledge_base":
        return <FileText className="h-3 w-3" />;
      case "perplexity":
        return <ExternalLink className="h-3 w-3" />;
      default:
        return <Scale className="h-3 w-3" />;
    }
  };

  const getSourceLabel = () => {
    if (!citationDetails) return "Legal Citation";
    
    switch (citationDetails.source) {
      case "courtlistener":
        return "Court Opinion";
      case "knowledge_base":
        return "Legal Document";
      case "perplexity":
        return "AI Research";
      default:
        return "Legal Citation";
    }
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
        {citationDetails && (
          <Badge variant="secondary" className="text-xs ml-1">
            {getSourceLabel()}
          </Badge>
        )}
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