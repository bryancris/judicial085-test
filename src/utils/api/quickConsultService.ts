import { invokeFunction } from "./baseApiService";

export interface QuickConsultMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QuickConsultResponse {
  text: string;
  citations?: Array<{
    id: string;
    type: string;
    source: string;
    title: string;
    relevance: number;
    content_preview?: string;
    docket_number?: string;
    court?: string;
    date_filed?: string;
    url?: string;
    verified?: boolean;
  }>;
  hasKnowledgeBase?: boolean;
  documentsFound?: number;
  verifiedCases?: number;
  courtListenerCitations?: number;
  error?: string;
}

export const sendQuickConsultMessage = async (
  messages: QuickConsultMessage[],
  clientId?: string,
  userId?: string
): Promise<QuickConsultResponse> => {
  try {
    // Get the latest user message for the 3-agent system
    const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
    const userQuery = latestUserMessage?.content || '';

    console.log('🎯 Quick Consult using 3-Agent System:', { 
      query: userQuery.substring(0, 100) + '...', 
      clientId, 
      userId 
    });

    const { data, error } = await invokeFunction<{
      text: string;
      citations?: any[];
      hasKnowledgeBase?: boolean;
      documentsFound?: number;
      verifiedCases?: number;
      courtListenerCitations?: number;
      courtListenerStatus?: string;
      success: boolean;
      researchSources?: Array<{
        source: string;
        type: string;
        available: boolean;
      }>;
      metadata?: {
        totalResearchAgents: number;
        synthesisEngine: string;
        verificationEngine: string;
        timestamp: string;
      };
    }>("ai-agent-coordinator", {
      query: userQuery,
      clientId,
      userId,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })),
      researchTypes: ['legal-research', 'current-research'] // Enable all 3 agents
    });

    if (error) {
      console.error('3-Agent Quick Consult error:', error);
      return { text: "", error };
    }

    if (!data?.success) {
      console.error('3-Agent Quick Consult failed:', data);
      return { text: "", error: "Failed to coordinate AI agents" };
    }

    // Handle CourtListener verification status gracefully
    if (data.courtListenerStatus) {
      switch (data.courtListenerStatus) {
        case 'success':
          console.log(`⚖️ ${data.verifiedCases || 0} legal cases verified with CourtListener`);
          break;
        case 'token_missing':
          console.warn('⚠️ CourtListener verification unavailable - API token not configured');
          break;
        case 'failed':
          console.warn('⚠️ CourtListener verification temporarily unavailable');
          break;
        case 'not_attempted':
          // No cases to verify, this is normal
          break;
      }
    }

    console.log('✅ 3-Agent Quick Consult completed:', {
      agentsUsed: data.metadata?.totalResearchAgents || 0,
      verifiedCases: data.verifiedCases || 0,
      documentsFound: data.documentsFound || 0,
      courtListenerStatus: data.courtListenerStatus || 'unknown'
    });

    return { 
      text: data?.text || "",
      citations: data?.citations || [],
      hasKnowledgeBase: data?.hasKnowledgeBase || false,
      documentsFound: data?.documentsFound || 0,
      verifiedCases: data?.verifiedCases || 0,
      courtListenerCitations: data?.courtListenerCitations || 0
    };
  } catch (err: any) {
    console.error("Error in 3-agent quick consult:", err);
    return { text: "", error: err.message };
  }
};