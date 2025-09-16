import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CaseLawItem {
  id: string;
  title: string;
  citation: string;
  holding: string;
  relevance: string;
  type: 'favorable' | 'adverse' | 'neutral';
}

interface AdditionalCaseLawSectionProps {
  caseLaw: CaseLawItem[];
  isLoading?: boolean;
}

const AdditionalCaseLawSection: React.FC<AdditionalCaseLawSectionProps> = ({
  caseLaw = [],
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-44 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!caseLaw || caseLaw.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span className="text-muted-foreground">Step 4:</span>
            Additional Case Law (Precedent research)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No additional case law research available.</p>
        </CardContent>
      </Card>
    );
  }

  const favorableCases = caseLaw.filter(c => c.type === 'favorable');
  const adverseCases = caseLaw.filter(c => c.type === 'adverse');
  const neutralCases = caseLaw.filter(c => c.type === 'neutral');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'favorable': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'adverse': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const renderCaseGroup = (cases: CaseLawItem[], title: string) => {
    if (cases.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-medium text-sm">{caseItem.title}</h5>
              <Badge className={getTypeColor(caseItem.type)}>
                {caseItem.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{caseItem.citation}</p>
            <p className="text-sm"><strong>Holding:</strong> {caseItem.holding}</p>
            <p className="text-sm"><strong>Relevance:</strong> {caseItem.relevance}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-muted-foreground">Step 4:</span>
          Additional Case Law (Precedent research)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderCaseGroup(favorableCases, "Favorable Precedents")}
        {renderCaseGroup(adverseCases, "Adverse Precedents")}
        {renderCaseGroup(neutralCases, "Additional Cases")}
      </CardContent>
    </Card>
  );
};

export default AdditionalCaseLawSection;