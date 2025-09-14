import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, AlertTriangle, Target, StickyNote } from "lucide-react";
import { parsePreliminaryAnalysis, PreliminaryAnalysisData } from "@/utils/preliminaryAnalysisParser";

interface PreliminaryAnalysisSectionProps {
  preliminaryAnalysis: string;
  isLoading?: boolean;
}

const PreliminaryAnalysisSection: React.FC<PreliminaryAnalysisSectionProps> = ({
  preliminaryAnalysis,
  isLoading = false
}) => {
  const parsedData = useMemo(() => {
    return parsePreliminaryAnalysis(preliminaryAnalysis || "");
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
      <CardContent className="space-y-6">
        {/* Potential Legal Areas */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Potential Legal Areas</h4>
          {parsedData.potentialLegalAreas.length > 0 ? (
            <ul className="space-y-1 ml-4">
              {parsedData.potentialLegalAreas.map((area, index) => (
                <li key={index} className="text-sm text-foreground list-disc">
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm ml-4">No potential legal areas identified.</p>
          )}
        </div>

        {/* Preliminary Issues */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Preliminary Issues</h4>
          {parsedData.preliminaryIssues.length > 0 ? (
            <ul className="space-y-1 ml-4">
              {parsedData.preliminaryIssues.map((issue, index) => (
                <li key={index} className="text-sm text-foreground list-disc">
                  {issue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm ml-4">No preliminary issues identified.</p>
          )}
        </div>

        {/* Research Priorities */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Research Priorities</h4>
          {parsedData.researchPriorities.length > 0 ? (
            <ul className="space-y-1 ml-4">
              {parsedData.researchPriorities.map((priority, index) => (
                <li key={index} className="text-sm text-foreground list-disc">
                  {priority}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm ml-4">No research priorities identified.</p>
          )}
        </div>

        {/* Strategic Notes */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Strategic Notes</h4>
          {parsedData.strategicNotes.length > 0 ? (
            <ul className="space-y-1 ml-4">
              {parsedData.strategicNotes.map((note, index) => (
                <li key={index} className="text-sm text-foreground list-disc">
                  {note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm ml-4">No strategic notes available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PreliminaryAnalysisSection;