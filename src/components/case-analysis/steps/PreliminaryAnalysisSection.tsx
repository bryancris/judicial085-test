import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface PreliminaryAnalysisSectionProps {
  preliminaryAnalysis: string;
  isLoading?: boolean;
}

const PreliminaryAnalysisSection: React.FC<PreliminaryAnalysisSectionProps> = ({
  preliminaryAnalysis,
  isLoading = false
}) => {
  const preliminaryAnalysisHtml = useMemo(() => {
    const md = (preliminaryAnalysis || "").trim();
    if (!md) return "";
    try {
      const html = marked.parse(md, { breaks: true });
      return DOMPurify.sanitize(typeof html === "string" ? html : String(html));
    } catch (e) {
      return DOMPurify.sanitize(`<p>${md.replace(/\n/g, "<br/>")}</p>`);
    }
  }, [preliminaryAnalysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-4/5"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preliminaryAnalysis?.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <span className="text-muted-foreground">Step 2:</span>
            Preliminary Analysis (AI-assisted broad issue spotting)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No preliminary analysis available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <span className="text-muted-foreground">Step 2:</span>
          Preliminary Analysis (AI-assisted broad issue spotting)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: preliminaryAnalysisHtml }} />
      </CardContent>
    </Card>
  );
};

export default PreliminaryAnalysisSection;