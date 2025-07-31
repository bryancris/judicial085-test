import { supabase } from "@/integrations/supabase/client";

export interface AIAgentRequest {
  query: string;
  clientId?: string;
  caseId?: string;
  context?: any;
  researchTypes?: string[];
}

export interface AIAgentResponse {
  success: boolean;
  synthesizedContent: string;
  citations: string[];
  researchSources: Array<{
    source: 'openai' | 'perplexity';
    type: string;
    available: boolean;
  }>;
  metadata?: {
    totalResearchAgents: number;
    synthesisEngine: string;
    timestamp: string;
  };
  error?: string;
}

/**
 * Coordinates research across OpenAI, Perplexity, and Gemini agents
 * - OpenAI: Primary legal research and document analysis
 * - Perplexity: Real-time legal research and case discovery
 * - Gemini: Synthesis engine with large context window
 */
export const coordinateAIAgents = async (request: AIAgentRequest): Promise<AIAgentResponse> => {
  try {
    console.log('🎯 Coordinating AI agents for query:', request.query);
    
    const { data, error } = await supabase.functions.invoke('ai-agent-coordinator', {
      body: request
    });

    if (error) {
      console.error('AI Agent coordination error:', error);
      return {
        success: false,
        synthesizedContent: '',
        citations: [],
        researchSources: [],
        error: error.message || 'Failed to coordinate AI agents'
      };
    }

    console.log('✅ AI Agent coordination successful:', {
      researchSources: data.researchSources?.length || 0,
      citationsCount: data.citations?.length || 0,
      contentLength: data.synthesizedContent?.length || 0
    });

    return data;
  } catch (err: any) {
    console.error('Exception in AI agent coordination:', err);
    return {
      success: false,
      synthesizedContent: '',
      citations: [],
      researchSources: [],
      error: err.message || 'Unexpected error in AI agent coordination'
    };
  }
};

/**
 * Quick legal research using the AI agent system
 * Optimized for common legal queries
 */
export const quickLegalResearch = async (
  query: string,
  clientId?: string,
  caseId?: string
): Promise<AIAgentResponse> => {
  return coordinateAIAgents({
    query,
    clientId,
    caseId,
    researchTypes: ['legal-research', 'current-research']
  });
};

/**
 * Comprehensive case analysis using all AI agents
 * Best for complex legal matters requiring extensive research
 */
export const comprehensiveCaseAnalysis = async (
  query: string,
  clientId: string,
  caseId?: string,
  context?: any
): Promise<AIAgentResponse> => {
  return coordinateAIAgents({
    query,
    clientId,
    caseId,
    context,
    researchTypes: ['legal-research', 'similar-cases', 'current-research']
  });
};

/**
 * Document-focused analysis using OpenAI + Gemini synthesis
 * Best for contract review and document analysis
 */
export const documentAnalysis = async (
  query: string,
  clientId: string,
  context?: any
): Promise<AIAgentResponse> => {
  return coordinateAIAgents({
    query,
    clientId,
    context,
    researchTypes: ['legal-research'] // Focus on OpenAI for document analysis
  });
};