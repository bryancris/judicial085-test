import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Scale, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Target,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  IracAnalysis, 
  RiskAssessmentAnalysis, 
  IssueRiskAssessment,
  Challenge,
  OpposingArgument,
  BurdenOfProofElement,
  RiskLevel 
} from '@/types/caseAnalysis';
import { analyzeRiskAssessment } from '@/utils/riskAssessmentAnalyzer';

interface RiskAssessmentSectionProps {
  analysis: IracAnalysis;
  isLoading?: boolean;
}

export function RiskAssessmentSection({ analysis, isLoading }: RiskAssessmentSectionProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  const riskAssessment = useMemo(() => 
    analyzeRiskAssessment(analysis), 
    [analysis]
  );

  const toggleIssueExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Assessment
          <Badge variant={getRiskVariant(riskAssessment.overallCaseRisk)} className="ml-auto">
            {riskAssessment.overallCaseRisk.toUpperCase()} RISK
          </Badge>
        </CardTitle>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Detailed Analysis
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'overview' ? (
          <RiskOverview riskAssessment={riskAssessment} />
        ) : (
          <DetailedRiskAnalysis 
            riskAssessment={riskAssessment}
            expandedIssues={expandedIssues}
            toggleIssueExpanded={toggleIssueExpanded}
          />
        )}
      </CardContent>
    </Card>
  );
}

function RiskOverview({ riskAssessment }: { riskAssessment: RiskAssessmentAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Critical Vulnerabilities */}
      {riskAssessment.criticalVulnerabilities.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold text-destructive">Critical Vulnerabilities</h3>
          </div>
          <ul className="space-y-1">
            {riskAssessment.criticalVulnerabilities.map((vulnerability, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1 h-1 bg-destructive rounded-full" />
                {vulnerability}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk by Category */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Strength by Category
        </h3>
        <div className="grid gap-4">
          {Object.entries(riskAssessment.strengthsByCategory).map(([category, strength]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize font-medium">{category}</span>
                <span>{strength}% Strong</span>
              </div>
              <Progress value={strength} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Recommended Actions
        </h3>
        <ul className="space-y-2">
          {riskAssessment.recommendedActions.map((action, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* Risk Mitigation Plan */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Risk Mitigation Plan
        </h3>
        <div className="space-y-2">
          {riskAssessment.riskMitigationPlan.map((step, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                {index + 1}
              </div>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailedRiskAnalysis({ 
  riskAssessment, 
  expandedIssues, 
  toggleIssueExpanded 
}: {
  riskAssessment: RiskAssessmentAnalysis;
  expandedIssues: Set<string>;
  toggleIssueExpanded: (issueId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {riskAssessment.issueRisks.map((issueRisk) => (
        <IssueRiskCard
          key={issueRisk.issueId}
          issueRisk={issueRisk}
          isExpanded={expandedIssues.has(issueRisk.issueId)}
          onToggle={() => toggleIssueExpanded(issueRisk.issueId)}
        />
      ))}
    </div>
  );
}

function IssueRiskCard({ 
  issueRisk, 
  isExpanded, 
  onToggle 
}: {
  issueRisk: IssueRiskAssessment;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={getRiskVariant(issueRisk.overallRisk)}>
                  {issueRisk.overallRisk.toUpperCase()}
                </Badge>
                <span className="font-medium">Issue {issueRisk.issueId}</span>
                <Badge variant="outline" className={getPriorityClasses(issueRisk.mitigationPriority)}>
                  {issueRisk.mitigationPriority.toUpperCase()} PRIORITY
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Evidence: {issueRisk.evidenceAdequacy}%
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2 border-l-4 border-l-primary/20">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Challenges */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  Challenges ({issueRisk.challenges.length})
                </h4>
                <div className="space-y-3">
                  {issueRisk.challenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              </div>

              {/* Opposing Arguments */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4" />
                  Opposing Arguments ({issueRisk.opposingArguments.length})
                </h4>
                <div className="space-y-3">
                  {issueRisk.opposingArguments.map((argument) => (
                    <OpposingArgumentCard key={argument.id} argument={argument} />
                  ))}
                </div>
              </div>

              {/* Burden of Proof */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4" />
                  Burden of Proof ({issueRisk.burdenOfProof.length})
                </h4>
                <div className="space-y-3">
                  {issueRisk.burdenOfProof.map((element) => (
                    <BurdenElementCard key={element.id} element={element} />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <h5 className="font-medium text-sm">{challenge.title}</h5>
        <Badge variant={getRiskVariant(challenge.riskLevel)} className="text-xs">
          {challenge.riskLevel}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{challenge.description}</p>
      <div className="text-xs">
        <div className="font-medium mb-1">Impact:</div>
        <div className="text-muted-foreground">{challenge.impact}</div>
      </div>
      {challenge.mitigationSuggestions.length > 0 && (
        <div className="text-xs">
          <div className="font-medium mb-1">Mitigation:</div>
          <ul className="text-muted-foreground space-y-1">
            {challenge.mitigationSuggestions.slice(0, 2).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1">
                <div className="w-1 h-1 bg-current rounded-full mt-1.5 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OpposingArgumentCard({ argument }: { argument: OpposingArgument }) {
  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <Badge variant={getRiskVariant(argument.strength)} className="text-xs">
          {argument.strength} STRENGTH
        </Badge>
      </div>
      <p className="text-xs font-medium">{argument.argument}</p>
      <div className="text-xs">
        <div className="font-medium mb-1">Counter Strategy:</div>
        <div className="text-muted-foreground">{argument.counterStrategy}</div>
      </div>
    </div>
  );
}

function BurdenElementCard({ element }: { element: BurdenOfProofElement }) {
  return (
    <div className="bg-card border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <h5 className="font-medium text-sm">{element.element}</h5>
        <Badge variant={getRiskVariant(element.difficultyLevel)} className="text-xs">
          {element.difficultyLevel}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{element.description}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Evidence Strength</span>
          <span>{element.evidenceStrength}%</span>
        </div>
        <Progress value={element.evidenceStrength} className="h-1" />
      </div>
      {element.evidenceGaps.length > 0 && (
        <div className="text-xs">
          <div className="font-medium mb-1 text-destructive">Evidence Gaps:</div>
          <ul className="text-muted-foreground space-y-1">
            {element.evidenceGaps.slice(0, 2).map((gap, index) => (
              <li key={index} className="flex items-start gap-1">
                <TrendingDown className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getRiskVariant(risk: RiskLevel): "default" | "secondary" | "destructive" {
  switch (risk) {
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'default';
    default: return 'default';
  }
}

function getPriorityClasses(priority: string): string {
  switch (priority) {
    case 'critical': return 'border-destructive text-destructive';
    case 'important': return 'border-orange-500 text-orange-600';
    case 'moderate': return 'border-yellow-500 text-yellow-600';
    case 'low': return 'border-green-500 text-green-600';
    default: return '';
  }
}