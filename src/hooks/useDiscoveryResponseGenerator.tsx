
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscoveryRequest, DiscoveryAnalysisResult, DiscoveryCitation } from '@/types/discovery';
import { createDiscoveryResponse } from '@/utils/discoveryService';
import { useToast } from '@/hooks/use-toast';

export function useDiscoveryResponseGenerator(
  request: DiscoveryRequest,
  onResponseCreated: () => void
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<DiscoveryAnalysisResult | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [citations, setCitations] = useState<DiscoveryCitation[]>([]);
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
      setCitations(data.citations || []);
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

  const saveResponse = async (responseContent: string) => {
    if (!responseContent.trim()) {
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
        content: responseContent,
        status: 'draft' as const,
        citations: citations,
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

  return {
    analysis,
    generatedResponse,
    citations,
    isAnalyzing,
    isGenerating,
    analyzeRequest,
    saveResponse
  };
}
