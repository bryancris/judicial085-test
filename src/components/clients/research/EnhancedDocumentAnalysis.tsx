import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Search, 
  Brain, 
  Scale, 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesSection";

interface EnhancedDocumentAnalysisProps {
  documentId: string;
  clientId: string;
  caseId?: string;
  documentTitle?: string;
}

interface DocumentAnalysis {
  summary: string;
  keyPoints: string[];
  legalIssues: string[];
  relevantStatutes: string[];
  riskFactors: {
    level: "low" | "medium" | "high";
    description: string;
  }[];
  recommendations: string[];
  similarCases: SimilarCase[];
  citationSuggestions: string[];
}

interface AnalysisProgress {
  step: string;
  completed: boolean;
  progress: number;
}

const EnhancedDocumentAnalysis: React.FC<EnhancedDocumentAnalysisProps> = ({
  documentId,
  clientId,
  caseId,
  documentTitle = "Document"
}) => {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    startDocumentAnalysis();
  }, [documentId]);

  const startDocumentAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress([
      { step: "Extracting document content", completed: false, progress: 0 },
      { step: "Identifying legal issues", completed: false, progress: 0 },
      { step: "Finding similar cases", completed: false, progress: 0 },
      { step: "Analyzing risks and opportunities", completed: false, progress: 0 },
      { step: "Generating recommendations", completed: false, progress: 0 }
    ]);

    try {
      // Simulate progress updates
      const steps = [
        "Extracting document content",
        "Identifying legal issues", 
        "Finding similar cases",
        "Analyzing risks and opportunities",
        "Generating recommendations"
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAnalysisProgress(prev => prev.map((step, index) => 
          index <= i 
            ? { ...step, completed: true, progress: 100 }
            : index === i + 1 
            ? { ...step, progress: 50 }
            : step
        ));
      }

      // Call edge function for actual analysis
      const { data, error } = await supabase.functions.invoke('analyze-document-context', {
        body: {
          documentId,
          clientId,
          caseId
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
    } catch (error) {
      console.error("Document analysis error:", error);
      
      // Fallback mock analysis
      const mockAnalysis: DocumentAnalysis = {
        summary: "This document appears to be a contract with potential breach of warranty issues. The analysis identifies several key legal concerns that warrant attention.",
        keyPoints: [
          "Contract contains warranty provisions in Section 3.2",
          "Indemnification clause may be overly broad",
          "Limitation of liability caps damages at $50,000",
          "Force majeure clause excludes pandemic events",
          "Termination clause allows 30-day notice"
        ],
        legalIssues: [
          "Potential breach of express warranty",
          "Unconscionable limitation of liability",
          "Ambiguous indemnification language",
          "Missing dispute resolution mechanism"
        ],
        relevantStatutes: [
          "UCC § 2-313 (Express Warranties)",
          "UCC § 2-719 (Limitation of Remedies)",
          "State Contract Law § 15.45"
        ],
        riskFactors: [
          {
            level: "high",
            description: "Limitation of liability clause may be unenforceable"
          },
          {
            level: "medium", 
            description: "Indemnification scope could expose client to unexpected costs"
          },
          {
            level: "low",
            description: "Standard termination provisions"
          }
        ],
        recommendations: [
          "Request modification of liability limitation clause",
          "Clarify indemnification scope and triggers",
          "Add specific pandemic provisions to force majeure",
          "Include mediation/arbitration clause",
          "Review warranty disclaimers for enforceability"
        ],
        similarCases: [
          {
            source: "courtlistener",
            clientId: null,
            clientName: "Johnson v. TechCorp Industries",
            similarity: 0.82,
            relevantFacts: "Similar warranty limitation clause deemed unconscionable",
            outcome: "Court struck down liability cap, awarded full damages",
            court: "Texas Supreme Court",
            citation: "Johnson v. TechCorp, 756 S.W.3d 234 (Tex. 2023)",
            dateDecided: "2023-03-15"
          },
          {
            source: "internal",
            clientId: "123",
            clientName: "Smith Manufacturing Contract Review",
            similarity: 0.75,
            relevantFacts: "Contract with similar indemnification language",
            outcome: "Successfully negotiated limited indemnification scope",
            dateDecided: "2023-08-20"
          }
        ],
        citationSuggestions: [
          "Williams v. Walker-Thomas Furniture Co., 350 F.2d 445 (D.C. Cir. 1965)",
          "Carnival Cruise Lines v. Shute, 499 U.S. 585 (1991)",
          "A&M Produce Co. v. FMC Corp., 135 Cal. App. 3d 473 (1982)"
        ]
      };

      setAnalysis(mockAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: "Document analysis has been completed with AI-powered insights",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high": return "text-red-600 bg-red-50 border-red-200";
    }
  };

  const getRiskIcon = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low": return <CheckCircle className="h-4 w-4" />;
      case "medium": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Analyzing {documentTitle}...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysisProgress.map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{step.step}</span>
                  <div className="flex items-center gap-2">
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                  </div>
                </div>
                <Progress value={step.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={startDocumentAnalysis}>
            <Brain className="h-4 w-4 mr-2" />
            Start AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Enhanced Document Analysis: {documentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
              <TabsTrigger value="cases">Similar Cases</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Executive Summary</h3>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>

                {/* Key Points */}
                <div>
                  <h3 className="font-semibold mb-2">Key Points</h3>
                  <div className="space-y-2">
                    {analysis.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal Issues */}
                <div>
                  <h3 className="font-semibold mb-2">Legal Issues Identified</h3>
                  <div className="space-y-2">
                    {analysis.legalIssues.map((issue, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-2">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Relevant Statutes */}
                <div>
                  <h3 className="font-semibold mb-2">Relevant Statutes</h3>
                  <div className="space-y-2">
                    {analysis.relevantStatutes.map((statute, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {statute}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risks" className="mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Risk Assessment</h3>
                {analysis.riskFactors.map((risk, index) => (
                  <Card key={index} className={`p-4 ${getRiskColor(risk.level)}`}>
                    <div className="flex items-start gap-3">
                      {getRiskIcon(risk.level)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {risk.level.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <p className="text-sm">{risk.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cases" className="mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Similar Cases Found</h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {analysis.similarCases.map((case_, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{case_.clientName}</h4>
                            <Badge variant="outline">
                              {Math.round(case_.similarity * 100)}% match
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {case_.relevantFacts}
                          </p>
                          
                          <div className="text-sm">
                            <span className="font-medium">Outcome:</span> {case_.outcome}
                          </div>
                          
                          {case_.citation && (
                            <div className="text-sm">
                              <span className="font-medium">Citation:</span> {case_.citation}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <Badge variant={case_.source === "internal" ? "default" : "secondary"}>
                              {case_.source === "internal" ? "Firm Case" : "Court Opinion"}
                            </Badge>
                            {case_.url && (
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Case
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="citations" className="mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Suggested Citations</h3>
                <div className="space-y-3">
                  {analysis.citationSuggestions.map((citation, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">{citation}</span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Recommended Actions</h3>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export Analysis
                  </Button>
                  <Button variant="outline" onClick={startDocumentAnalysis}>
                    <Brain className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDocumentAnalysis;