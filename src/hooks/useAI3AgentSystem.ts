import { useState } from "react";
import { coordinateAIAgents, comprehensiveCaseAnalysis, quickLegalResearch } from "@/utils/api/aiAgentService";
import { useToast } from "@/hooks/use-toast";

export interface AI3AgentRequest {
  query: string;
  clientId?: string;
  caseId?: string;
  researchType?: 'quick' | 'comprehensive' | 'custom';
  customResearchTypes?: string[];
}

export interface AI3AgentResult {
  success: boolean;
  content: string;
  citations: string[];
  sources: Array<{
    source: 'openai' | 'perplexity';
    type: string;
    available: boolean;
  }>;
  metadata?: {
    totalAgents: number;
    synthesisEngine: string;
    timestamp: string;
  };
  error?: string;
}

export const useAI3AgentSystem = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAgentActivity, setCurrentAgentActivity] = useState<string>('');
  const { toast } = useToast();

  const process3AgentRequest = async (request: AI3AgentRequest): Promise<AI3AgentResult> => {
    setIsProcessing(true);
    setCurrentAgentActivity('🎯 Coordinating AI agents...');
    
    try {
      let result;
      
      // Determine which coordination strategy to use
      switch (request.researchType) {
        case 'quick':
          setCurrentAgentActivity('🔍 Running quick legal research...');
          result = await quickLegalResearch(request.query, request.clientId, request.caseId);
          break;
          
        case 'comprehensive':
          if (!request.clientId) {
            throw new Error('Client ID required for comprehensive analysis');
          }
          setCurrentAgentActivity('📚 Running comprehensive case analysis...');
          result = await comprehensiveCaseAnalysis(request.query, request.clientId, request.caseId);
          break;
          
        case 'custom':
        default:
          setCurrentAgentActivity('⚙️ Running custom agent coordination...');
          result = await coordinateAIAgents({
            query: request.query,
            clientId: request.clientId,
            caseId: request.caseId,
            researchTypes: request.customResearchTypes
          });
          break;
      }

      setCurrentAgentActivity('🧠 Gemini synthesizing results...');
      
      if (!result.success) {
        throw new Error(result.error || 'AI agent coordination failed');
      }

      console.log('✅ 3-Agent system completed:', {
        sources: result.researchSources?.length || 0,
        citations: result.citations?.length || 0,
        contentLength: result.synthesizedContent?.length || 0
      });

      // Show success notification
      toast({
        title: "AI Analysis Complete",
        description: `Analysis generated using ${result.researchSources?.length || 0} research agents and Gemini synthesis.`,
      });

      return {
        success: true,
        content: result.synthesizedContent,
        citations: result.citations,
        sources: result.researchSources || [],
        metadata: result.metadata
      };

    } catch (error: any) {
      console.error('3-Agent system error:', error);
      
      toast({
        title: "AI Analysis Error",
        description: error.message || "Failed to coordinate AI agents",
        variant: "destructive",
      });

      return {
        success: false,
        content: '',
        citations: [],
        sources: [],
        error: error.message || 'AI agent coordination failed'
      };
    } finally {
      setIsProcessing(false);
      setCurrentAgentActivity('');
    }
  };

  // Quick research using OpenAI + Perplexity agents
  const quickResearch = async (query: string, clientId?: string, caseId?: string) => {
    return process3AgentRequest({
      query,
      clientId,
      caseId,
      researchType: 'quick'
    });
  };

  // Comprehensive analysis using all agents
  const comprehensiveAnalysis = async (query: string, clientId: string, caseId?: string) => {
    return process3AgentRequest({
      query,
      clientId,
      caseId,
      researchType: 'comprehensive'
    });
  };

  // Custom coordination with specific research types
  const customResearch = async (
    query: string, 
    researchTypes: string[], 
    clientId?: string, 
    caseId?: string
  ) => {
    return process3AgentRequest({
      query,
      clientId,
      caseId,
      researchType: 'custom',
      customResearchTypes: researchTypes
    });
  };

  return {
    isProcessing,
    currentAgentActivity,
    quickResearch,
    comprehensiveAnalysis,
    customResearch,
    process3AgentRequest
  };
};