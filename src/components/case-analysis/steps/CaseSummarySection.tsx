import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface CaseSummarySectionProps {
  caseSummary: string;
  isLoading?: boolean;
}

const CaseSummarySection: React.FC<CaseSummarySectionProps> = ({
  caseSummary,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!caseSummary?.trim()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-muted-foreground">Step 1:</span>
            Case Summary (Organized Fact Pattern)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No case summary available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="text-muted-foreground">Step 1:</span>
          Case Summary (Organized Fact Pattern)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none text-sm">
          {caseSummary.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseSummarySection;