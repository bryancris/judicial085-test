import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Network, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  AlertTriangle, 
  Target,
  Lightbulb,
  Link2,
  TrendingUp,
  GitBranch,
  AlertCircle
} from "lucide-react";
import { IracIssue, SmartConnectionsAnalysis, IssueConnection, ConnectionType } from "@/types/caseAnalysis";
import { analyzeSmartConnections } from "@/utils/smartConnectionsAnalyzer";
import { assessIssueStrength } from "@/utils/iracAssessment";

interface SmartConnectionsSectionProps {
  issues: IracIssue[];
  isLoading?: boolean;
}

interface ConnectionCardProps {
  connection: IssueConnection;
  issues: IracIssue[];
  onNavigateToIssue: (issueId: string) => void;
}

const getConnectionTypeConfig = (type: ConnectionType) => {
  switch (type) {
    case 'supporting':
      return {
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Mutually Supporting',
        description: 'These issues strengthen each other'
      };
    case 'shared_facts':
      return {
        icon: Link2,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        label: 'Shared Foundation',
        description: 'Common factual or legal basis'
      };
    case 'alternative':
      return {
        icon: GitBranch,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        label: 'Alternative Path',
        description: 'Different routes to similar outcomes'
      };
    case 'conflicting':
      return {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Potential Conflict',
        description: 'May have contradictory positions'
      };
    case 'dependent':
      return {
        icon: ArrowRight,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        label: 'Dependency',
        description: 'One issue depends on another\'s success'
      };
  }
};

const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, issues, onNavigateToIssue }) => {
  const fromIssue = issues.find(i => i.id === connection.fromIssueId);
  const toIssue = issues.find(i => i.id === connection.toIssueId);
  const config = getConnectionTypeConfig(connection.type);
  const IconComponent = config.icon;
  
  if (!fromIssue || !toIssue) return null;

  const fromIndex = issues.findIndex(i => i.id === connection.fromIssueId) + 1;
  const toIndex = issues.findIndex(i => i.id === connection.toIssueId) + 1;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-l-4 hover:shadow-md transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconComponent className={`h-4 w-4 ${config.color}`} />
            <Badge variant="outline" className={`${config.color} border-current`}>
              {config.label}
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(connection.strength * 100)}% strength
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connection strength based on shared elements and text similarity</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToIssue(connection.fromIssueId)}
              className="h-auto p-2 justify-start text-left"
            >
              <div>
                <div className="font-medium text-sm">Issue {fromIndex}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {fromIssue.issueStatement}
                </div>
              </div>
            </Button>
            
            <ArrowRight className={`h-4 w-4 ${config.color} flex-shrink-0 mx-2`} />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToIssue(connection.toIssueId)}
              className="h-auto p-2 justify-start text-left"
            >
              <div>
                <div className="font-medium text-sm">Issue {toIndex}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {toIssue.issueStatement}
                </div>
              </div>
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-background/50 rounded p-2">
            {connection.strategicImplication}
          </div>

          {connection.sharedElements.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {connection.sharedElements.slice(0, 3).map((element, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {element}
                </Badge>
              ))}
              {connection.sharedElements.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{connection.sharedElements.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SmartConnectionsSection: React.FC<SmartConnectionsSectionProps> = ({ 
  issues, 
  isLoading = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const analysis = useMemo(() => {
    if (isLoading || issues.length < 2) return null;
    return analyzeSmartConnections(issues);
  }, [issues, isLoading]);

  const handleNavigateToIssue = (issueId: string) => {
    const element = document.getElementById(`irac-issue-${issueId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Smart Connections
            <div className="animate-pulse h-4 w-16 bg-muted rounded ml-2"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || issues.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Smart Connections
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Relationship analysis requires at least 2 legal issues
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add more legal issues to see their strategic connections</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Smart Connections</CardTitle>
            <Badge variant="outline" className="text-xs">
              {analysis.connections.length} connections found
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Strategic relationships and dependencies between legal issues
        </p>
        
        {/* Case Cohesion Score */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Case Cohesion</span>
            <span className="font-medium">{Math.round(analysis.overallCohesion * 100)}%</span>
          </div>
          <Progress value={analysis.overallCohesion * 100} className="h-2" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
          {/* Key Insights */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Keystone Issues */}
            {analysis.keystoneIssues.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <h4 className="font-semibold text-sm">Keystone Issues</h4>
                </div>
                <div className="space-y-1">
                  {analysis.keystoneIssues.map(issueId => {
                    const issue = issues.find(i => i.id === issueId);
                    const index = issues.findIndex(i => i.id === issueId) + 1;
                    return issue ? (
                      <Button
                        key={issueId}
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToIssue(issueId)}
                        className="w-full justify-start h-auto p-2"
                      >
                        <div className="text-left">
                          <div className="font-medium text-xs">Issue {index}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {issue.issueStatement}
                          </div>
                        </div>
                      </Button>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  These issues strengthen multiple claims
                </p>
              </div>
            )}

            {/* Vulnerable Issues */}
            {analysis.vulnerableIssues.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="font-semibold text-sm">Vulnerable Issues</h4>
                </div>
                <div className="space-y-1">
                  {analysis.vulnerableIssues.map(issueId => {
                    const issue = issues.find(i => i.id === issueId);
                    const index = issues.findIndex(i => i.id === issueId) + 1;
                    return issue ? (
                      <Button
                        key={issueId}
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToIssue(issueId)}
                        className="w-full justify-start h-auto p-2 border-red-200 dark:border-red-800"
                      >
                        <div className="text-left">
                          <div className="font-medium text-xs">Issue {index}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {issue.issueStatement}
                          </div>
                        </div>
                      </Button>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Weak issues that could undermine others
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Issue Connections */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Issue Relationships</h4>
            </div>
            
            <div className="space-y-3">
              {analysis.connections.map(connection => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  issues={issues}
                  onNavigateToIssue={handleNavigateToIssue}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Strategic Recommendations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Strategic Recommendations</h4>
            </div>
            
            <ul className="space-y-2">
              {analysis.strategicRecommendations.map((recommendation, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SmartConnectionsSection;