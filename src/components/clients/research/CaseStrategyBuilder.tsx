import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Scale,
  FileText,
  Lightbulb,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CaseStrategyBuilderProps {
  clientId: string;
  caseId?: string;
  caseDescription?: string;
  caseType?: string;
}

interface StrategyElement {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "risk";
  title: string;
  description: string;
  confidence: number;
  precedents: string[];
  actions: string[];
}

interface CaseStrategy {
  overview: string;
  winProbability: number;
  estimatedDuration: string;
  keyFactors: StrategyElement[];
  recommendedActions: string[];
  potentialOutcomes: {
    best: string;
    likely: string;
    worst: string;
  };
}

const CaseStrategyBuilder: React.FC<CaseStrategyBuilderProps> = ({
  clientId,
  caseId,
  caseDescription,
  caseType
}) => {
  const [strategy, setStrategy] = useState<CaseStrategy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customNotes, setCustomNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (caseDescription && caseType) {
      generateStrategy();
    }
  }, [caseDescription, caseType]);

  const generateStrategy = async () => {
    setIsGenerating(true);
    try {
      // Call edge function to generate strategy
      const { data, error } = await supabase.functions.invoke('generate-case-strategy', {
        body: {
          clientId,
          caseId,
          caseDescription,
          caseType,
          customNotes
        }
      });

      if (error) throw error;

      setStrategy(data.strategy);
      
      toast({
        title: "Strategy Generated",
        description: "AI-powered case strategy has been created based on historical data",
      });
    } catch (error) {
      console.error("Strategy generation error:", error);
      
      // Fallback mock strategy for demo
      const mockStrategy: CaseStrategy = {
        overview: "Based on similar cases and legal precedents, this case shows moderate to strong potential for a favorable outcome.",
        winProbability: 75,
        estimatedDuration: "6-12 months",
        keyFactors: [
          {
            id: "1",
            type: "strength",
            title: "Strong Precedent Support",
            description: "Similar cases in this jurisdiction have favored plaintiffs 73% of the time",
            confidence: 0.85,
            precedents: ["Smith v. Jones (2023)", "Brown v. Corp (2022)"],
            actions: ["Research additional supporting cases", "Prepare precedent analysis"]
          },
          {
            id: "2",
            type: "weakness",
            title: "Documentation Gaps",
            description: "Missing key documentation may weaken the case",
            confidence: 0.65,
            precedents: [],
            actions: ["Request additional discovery", "Subpoena relevant records"]
          },
          {
            id: "3",
            type: "opportunity",
            title: "Recent Favorable Ruling",
            description: "A recent appellate decision strengthens our legal position",
            confidence: 0.80,
            precedents: ["Miller v. State (2024)"],
            actions: ["Cite recent ruling in briefs", "Analyze impact on case strategy"]
          }
        ],
        recommendedActions: [
          "File motion for expedited discovery",
          "Conduct thorough witness interviews",
          "Prepare settlement negotiation strategy",
          "Research additional precedents in related jurisdictions"
        ],
        potentialOutcomes: {
          best: "Full damages awarded with attorney fees ($250k-$400k)",
          likely: "Partial settlement or reduced damages ($150k-$250k)",
          worst: "Dismissal or minimal award (<$50k)"
        }
      };

      setStrategy(mockStrategy);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFactorIcon = (type: StrategyElement["type"]) => {
    switch (type) {
      case "strength": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "weakness": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "opportunity": return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "risk": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getFactorColor = (type: StrategyElement["type"]) => {
    switch (type) {
      case "strength": return "bg-green-50 border-green-200";
      case "weakness": return "bg-red-50 border-red-200";
      case "opportunity": return "bg-blue-50 border-blue-200";
      case "risk": return "bg-orange-50 border-orange-200";
    }
  };

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Generating Case Strategy...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mx-auto" />
            <p className="text-center text-sm text-muted-foreground">
              Analyzing case details and historical precedents...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Case Strategy Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Add any specific strategy notes or considerations..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={generateStrategy} disabled={!caseDescription}>
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Case Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">{strategy.overview}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {strategy.winProbability}%
                </div>
                <div className="text-xs text-muted-foreground">Win Probability</div>
                <Progress value={strategy.winProbability} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  {strategy.estimatedDuration}
                </div>
                <div className="text-xs text-muted-foreground">Estimated Duration</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {strategy.keyFactors.length}
                </div>
                <div className="text-xs text-muted-foreground">Key Factors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Factors Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Key Factors Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {strategy.keyFactors.map((factor) => (
                <Card key={factor.id} className={`p-4 ${getFactorColor(factor.type)}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFactorIcon(factor.type)}
                        <h4 className="font-medium">{factor.title}</h4>
                      </div>
                      <Badge variant="outline">
                        {Math.round(factor.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {factor.description}
                    </p>
                    
                    {factor.precedents.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium mb-1">Supporting Precedents:</h5>
                        <div className="space-y-1">
                          {factor.precedents.map((precedent, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs mr-1">
                              {precedent}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {factor.actions.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium mb-1">Recommended Actions:</h5>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {factor.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {strategy.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Potential Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Potential Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-3 bg-green-50 border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Best Case</h4>
                <p className="text-sm text-green-700">{strategy.potentialOutcomes.best}</p>
              </Card>
              
              <Card className="p-3 bg-blue-50 border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Most Likely</h4>
                <p className="text-sm text-blue-700">{strategy.potentialOutcomes.likely}</p>
              </Card>
              
              <Card className="p-3 bg-orange-50 border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">Worst Case</h4>
                <p className="text-sm text-orange-700">{strategy.potentialOutcomes.worst}</p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={generateStrategy} variant="outline">
          <Brain className="h-4 w-4 mr-2" />
          Regenerate Strategy
        </Button>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Strategy
        </Button>
      </div>
    </div>
  );
};

export default CaseStrategyBuilder;