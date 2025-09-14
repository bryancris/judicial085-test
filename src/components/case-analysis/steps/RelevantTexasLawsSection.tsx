import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface RelevantTexasLawsSectionProps {
  relevantLaw: string;
  isLoading?: boolean;
}

const RelevantTexasLawsSection: React.FC<RelevantTexasLawsSectionProps> = ({
  relevantLaw,
  isLoading = false
}) => {
  const relevantLawHtml = useMemo(() => {
    const md = relevantLaw || "No relevant law analysis available.";
    try {
      const html = marked.parse(md, { breaks: true });
      return DOMPurify.sanitize(typeof html === "string" ? html : String(html));
    } catch (e) {
      return DOMPurify.sanitize(`<p>${md.replace(/\n/g, "<br/>")}</p>`);
    }
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
          className="prose dark:prose-invert max-w-none text-sm [&>ul]:space-y-2 [&>li]:mb-2 [&>p]:mb-2 [&>ul>li]:mb-3 [&>ul>li>p]:mb-1" 
          dangerouslySetInnerHTML={{ __html: relevantLawHtml }} 
        />
      </CardContent>
    </Card>
  );
};

export default RelevantTexasLawsSection;