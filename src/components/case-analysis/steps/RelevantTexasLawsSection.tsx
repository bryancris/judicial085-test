import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { processLawReferences } from "@/utils/lawReferences/processor";

interface RelevantTexasLawsSectionProps {
  relevantLaw: string;
  isLoading?: boolean;
}

const RelevantTexasLawsSection: React.FC<RelevantTexasLawsSectionProps> = ({
  relevantLaw,
  isLoading = false
}) => {
  const [relevantLawHtml, setRelevantLawHtml] = useState<string>("");

  useEffect(() => {
    const processLawContent = async () => {
      const md = relevantLaw || "No relevant law analysis available.";
      try {
        const html = marked.parse(md, { breaks: true });
        const htmlString = typeof html === "string" ? html : String(html);
        
        // Remove empty list items that create blank bullet points
        const cleanedHtml = htmlString.replace(/<li>\s*<\/li>/g, '').replace(/<li><\/li>/g, '');
        
        // Process law references - optimized version prioritizes hardcoded URLs
        const enhancedHtml = await processLawReferences(cleanedHtml);
        
        setRelevantLawHtml(DOMPurify.sanitize(enhancedHtml));
      } catch (e) {
        console.error('Error processing law content:', e);
        const fallbackHtml = `<p>${md.replace(/\n/g, "<br/>")}</p>`;
        const enhancedFallback = await processLawReferences(fallbackHtml);
        setRelevantLawHtml(DOMPurify.sanitize(enhancedFallback));
      }
    };

    processLawContent();
  }, [relevantLaw]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          <span className="text-muted-foreground">Step 3:</span>
          Relevant Texas Laws (Targeted legal research)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="legal-text-compact" 
          dangerouslySetInnerHTML={{ __html: relevantLawHtml }} 
        />
      </CardContent>
    </Card>
  );
};

export default RelevantTexasLawsSection;