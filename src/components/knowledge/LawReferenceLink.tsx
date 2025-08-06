
import React, { useState } from "react";
import { ExternalLink, FileText, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";

interface LawReferenceLinkProps {
  citation: string;
  url?: string | null;
  searchTerm?: string;
  children?: React.ReactNode;
}

const LawReferenceLink: React.FC<LawReferenceLinkProps> = ({ 
  citation, 
  url = null,
  searchTerm = "", 
  children 
}) => {
  const [isHarvesting, setIsHarvesting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuthState();

  const isJustiaUrl = url && (
    url.includes('justia.com') || 
    url.includes('supreme.justia.com') || 
    url.includes('law.justia.com')
  );

  const handleHarvestPdf = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to harvest legal documents.",
        variant: "destructive",
      });
      return;
    }

    if (!url || !isJustiaUrl) {
      toast({
        title: "Invalid URL",
        description: "This feature only works with Justia legal case links.",
        variant: "destructive",
      });
      return;
    }

    setIsHarvesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('harvest-legal-pdf', {
        body: {
          justiaUrl: url,
          caseTitle: citation,
          userId: session.user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Legal case harvested successfully",
          description: "The PDF has been downloaded and added to your firm's knowledge base.",
        });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error harvesting PDF:', error);
      toast({
        title: "Failed to harvest legal case",
        description: error.message || "An error occurred while downloading the PDF.",
        variant: "destructive",
      });
    } finally {
      setIsHarvesting(false);
    }
  };
  // Check if this is a special case for Gonzalez
  if (citation.includes("Gonzalez") && citation.includes("Wal-Mart")) {
    return (
      <a
        href="https://caselaw.findlaw.com/tx-supreme-court/1031086.html"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:underline hover:text-blue-800 group"
      >
        {children || citation}
        <FileText className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
      </a>
    );
  }
  
  // If we have a direct URL (likely a PDF), use that as an external link
  if (url) {
    return (
      <div className="inline-flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:underline hover:text-blue-800 group"
        >
          {children || citation}
          <FileText className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
        </a>
        {isJustiaUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHarvestPdf}
            disabled={isHarvesting}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            title="Download and add to knowledge base"
          >
            {isHarvesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }
  
  // Otherwise, fall back to knowledge search
  const encodedSearch = encodeURIComponent(citation);
  const searchUrl = `/knowledge?search=${encodedSearch}`;
  
  return (
    <Link
      to={searchUrl}
      className="inline-flex items-center text-blue-600 hover:underline hover:text-blue-800 group"
    >
      {children || citation}
      <ExternalLink className="ml-1 h-3 w-3 opacity-70 group-hover:opacity-100" />
    </Link>
  );
};

export default LawReferenceLink;
