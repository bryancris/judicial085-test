
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscoveryRequest } from '@/types/discovery';
import { createDiscoveryResponse } from '@/utils/discoveryService';
import { useToast } from '@/hooks/use-toast';
import DiscoveryAnalyzeCard from './DiscoveryAnalyzeCard';
import DiscoveryAnalysisCard from './DiscoveryAnalysisCard';
import DiscoveryResponseEditorCard from './DiscoveryResponseEditorCard';

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
        <DiscoveryAnalyzeCard 
          onAnalyze={analyzeRequest}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <>
          <DiscoveryAnalysisCard analysis={analysis} />
          
          <DiscoveryResponseEditorCard
            generatedResponse={generatedResponse}
            onSaveResponse={saveResponse}
            isGenerating={isGenerating}
          />
        </>
      )}
    </div>
  );
};

export default DiscoveryResponseGenerator;
