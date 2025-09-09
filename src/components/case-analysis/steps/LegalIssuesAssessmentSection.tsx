import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LegalIssue {
  id: string;
  title: string;
  strength: 'strong' | 'moderate' | 'weak' | 'eliminated';
  description: string;
  strategicPriority: number;
}

interface LegalIssuesAssessmentSectionProps {
  issues: LegalIssue[];
  isLoading?: boolean;
}

const LegalIssuesAssessmentSection: React.FC<LegalIssuesAssessmentSectionProps> = ({
  issues = [],
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-52 bg-muted animate-pulse rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <span className="text-muted-foreground">Step 6:</span>
            Legal Issues Assessment (Issues validated through analysis)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No legal issues assessment available.</p>
        </CardContent>
      </Card>
    );
  }

  const strongIssues = issues.filter(i => i.strength === 'strong');
  const moderateIssues = issues.filter(i => i.strength === 'moderate');
  const weakIssues = issues.filter(i => i.strength === 'weak');
  const eliminatedIssues = issues.filter(i => i.strength === 'eliminated');

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'strong': return <TrendingUp className="h-4 w-4" />;
      case 'moderate': return <Minus className="h-4 w-4" />;
      case 'weak': 
      case 'eliminated': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'eliminated': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const renderIssueGroup = (groupIssues: LegalIssue[], title: string) => {
    if (groupIssues.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        {groupIssues.map((issue, index) => (
          <div key={issue.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h5 className="font-medium text-sm">{issue.title}</h5>
              <div className="flex items-center gap-2">
                <Badge className={getStrengthColor(issue.strength)}>
                  {getStrengthIcon(issue.strength)}
                  {issue.strength}
                </Badge>
                <Badge variant="outline">
                  Priority {issue.strategicPriority}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <span className="text-muted-foreground">Step 6:</span>
          Legal Issues Assessment (Issues validated through analysis)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderIssueGroup(strongIssues, "Strong Issues")}
        {renderIssueGroup(moderateIssues, "Moderate Issues")}
        {renderIssueGroup(weakIssues, "Weak Issues")}
        {renderIssueGroup(eliminatedIssues, "Eliminated Issues")}
      </CardContent>
    </Card>
  );
};

export default LegalIssuesAssessmentSection;