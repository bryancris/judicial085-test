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
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Potential Legal Areas
          </h4>
          {parsedData.potentialLegalAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {parsedData.potentialLegalAreas.map((area, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No potential legal areas identified.</p>
          )}
        </div>

        {/* Preliminary Issues */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Preliminary Issues
          </h4>
          {parsedData.preliminaryIssues.length > 0 ? (
            <ul className="space-y-2">
              {parsedData.preliminaryIssues.map((issue, index) => (
                <li key={index} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">No preliminary issues identified.</p>
          )}
        </div>

        {/* Research Priorities */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Research Priorities
          </h4>
          {parsedData.researchPriorities.length > 0 ? (
            <ul className="space-y-2">
              {parsedData.researchPriorities.map((priority, index) => (
                <li key={index} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  {priority}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">No research priorities identified.</p>
          )}
        </div>

        {/* Strategic Notes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-green-500" />
            Strategic Notes
          </h4>
          {parsedData.strategicNotes.length > 0 ? (
            <ul className="space-y-2">
              {parsedData.strategicNotes.map((note, index) => (
                <li key={index} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-xs">No strategic notes available.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PreliminaryAnalysisSection;