
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscoveryRequest } from '@/types/discovery';
import { createDiscoveryResponse } from '@/utils/discoveryService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiscoveryResponseGeneratorProps {
  request: DiscoveryRequest;
  onResponseCreated: () => void;
}

interface AnalysisResult {
  requestType: string;
  requestCount: number;
  complexityScore: number;
  potentialIssues: string[];
  suggestedApproach: string;
}

const DiscoveryResponseGenerator: React.FC<DiscoveryResponseGeneratorProps> = ({ 
  request,
  onResponseCreated 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [editedResponse, setEditedResponse] = useState<string>('');
  const { toast } = useToast();

  const analyzeRequest = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-response', {
        body: {
          requestId: request.id,
          requestContent: request.content,
          clientInfo: {
            clientId: request.client_id
          }
        }
      });

      if (error) {
        toast({
          title: "Analysis Error",
          description: error.message || "Failed to analyze discovery request",
          variant: "destructive",
        });
        return;
      }

      setAnalysis(data.analysis);
      setGeneratedResponse(data.responseContent);
      setEditedResponse(data.responseContent);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResponse = async () => {
    if (!editedResponse.trim()) {
      toast({
        title: "Validation Error",
        description: "Response content cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const responseData = {
        request_id: request.id,
        content: editedResponse,
        status: 'draft' as const,
      };

      const { response, error } = await createDiscoveryResponse(responseData);
      
      if (error) {
        toast({
          title: "Error saving response",
          description: error,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Response saved successfully",
      });
      
      onResponseCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save discovery response",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!analysis ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Analyze Discovery Request</CardTitle>
            <CardDescription>
              AI will analyze the request and suggest appropriate responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Using AI, we'll analyze the request to identify:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Request type and format</li>
              <li>Number of individual requests</li>
              <li>Potential issues requiring objections</li>
              <li>Suggested approach for responding</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={analyzeRequest}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Request Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Request Type</p>
                  <p className="text-sm">{analysis.requestType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Request Count</p>
                  <p className="text-sm">{analysis.requestCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Complexity Score</p>
                  <p className="text-sm">{analysis.complexityScore}/10</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Potential Issues</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {analysis.potentialIssues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested Approach</p>
                <p className="text-sm">{analysis.suggestedApproach}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Generated Response</CardTitle>
              <CardDescription>
                Edit this AI-generated response before saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={editedResponse} 
                onChange={(e) => setEditedResponse(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setEditedResponse(generatedResponse)}
                disabled={isGenerating}
              >
                Reset to Original
              </Button>
              <Button 
                onClick={saveResponse}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Response
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default DiscoveryResponseGenerator;
