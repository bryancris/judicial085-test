import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Search, Database } from 'lucide-react';
import { useAI3AgentSystem } from '@/hooks/useAI3AgentSystem';

interface AI3AgentDemoProps {
  clientId?: string;
  caseId?: string;
}

export const AI3AgentDemo: React.FC<AI3AgentDemoProps> = ({ clientId, caseId }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const { isProcessing, currentAgentActivity, quickResearch, comprehensiveAnalysis, customResearch } = useAI3AgentSystem();

  const handleQuickResearch = async () => {
    if (!query.trim()) return;
    const response = await quickResearch(query, clientId, caseId);
    setResult(response);
  };

  const handleComprehensiveAnalysis = async () => {
    if (!query.trim() || !clientId) return;
    const response = await comprehensiveAnalysis(query, clientId, caseId);
    setResult(response);
  };

  const handleCustomResearch = async () => {
    if (!query.trim()) return;
    const response = await customResearch(query, ['legal-research', 'similar-cases', 'current-research'], clientId, caseId);
    setResult(response);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            3-Agent AI Legal Research System
          </CardTitle>
          <CardDescription>
            Powered by OpenAI, Perplexity, and Gemini working together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Legal Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your legal question or case details..."
              className="mt-1"
              rows={3}
            />
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentAgentActivity}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleQuickResearch}
              disabled={!query.trim() || isProcessing}
              variant="outline"
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Quick Research
            </Button>

            <Button
              onClick={handleComprehensiveAnalysis}
              disabled={!query.trim() || !clientId || isProcessing}
              variant="outline"
              size="sm"
            >
              <Database className="h-4 w-4 mr-2" />
              Comprehensive Analysis
            </Button>

            <Button
              onClick={handleCustomResearch}
              disabled={!query.trim() || isProcessing}
              variant="outline"
              size="sm"
            >
              <Brain className="h-4 w-4 mr-2" />
              Full 3-Agent Research
            </Button>
          </div>

          {!clientId && (
            <p className="text-sm text-muted-foreground">
              Note: Some features require client context. Navigate to a specific client to enable comprehensive analysis.
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Research Results</span>
              <div className="flex gap-1">
                {result.sources?.map((source: any, index: number) => (
                  <Badge
                    key={index}
                    variant={source.available ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {source.source}: {source.type}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  Gemini Synthesis
                </Badge>
              </div>
            </CardTitle>
            {result.metadata && (
              <CardDescription>
                Generated using {result.metadata.totalAgents} research agents • {result.metadata.synthesisEngine}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{result.content}</div>
                </div>
                
                {result.citations && result.citations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Citations & References:</h4>
                    <div className="space-y-1">
                      {result.citations.map((citation: string, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground border-l-2 pl-2">
                          {citation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-destructive">
                <p className="font-semibold">Research Failed</p>
                <p className="text-sm">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};