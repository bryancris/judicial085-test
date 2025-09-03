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

    if (!userQuery.trim()) {
      console.error('Quick Consult: Empty query provided');
      return { text: "", error: "No query provided" };
    }

    console.log('🎯 Quick Consult using 3-Agent System:', { 
      query: userQuery.substring(0, 100) + '...', 
      clientId, 
      userId,
      messageCount: messages.length
    });

    const startTime = Date.now();
    
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

    const elapsed = Date.now() - startTime;
    console.log(`🕐 AI Agent Coordinator took ${elapsed}ms`);

    if (error) {
      console.error('3-Agent Quick Consult error:', error);
      
      // Provide more specific error messages
      if (typeof error === 'string') {
        if (error.includes('timeout')) {
          return { text: "", error: "Request timed out. Please try again." };
        } else if (error.includes('unauthorized')) {
          return { text: "", error: "Authentication failed. Please refresh the page." };
        } else if (error.includes('rate limit')) {
          return { text: "", error: "Too many requests. Please wait a moment and try again." };
        }
      }
      
      return { text: "", error: error || "AI service temporarily unavailable" };
    }

    if (!data) {
      console.error('3-Agent Quick Consult: No data returned');
      return { text: "", error: "No response from AI service" };
    }

    if (!data.success) {
      console.error('3-Agent Quick Consult failed:', data);
      return { text: "", error: data.text || "Failed to coordinate AI agents" };
    }

    if (!data.text || data.text.trim().length === 0) {
      console.error('3-Agent Quick Consult: Empty response text');
      return { text: "", error: "AI service returned empty response" };
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
        default:
          console.log(`CourtListener status: ${data.courtListenerStatus}`);
      }
    }

    console.log('✅ 3-Agent Quick Consult completed successfully:', {
      agentsUsed: data.metadata?.totalResearchAgents || 0,
      verifiedCases: data.verifiedCases || 0,
      documentsFound: data.documentsFound || 0,
      courtListenerStatus: data.courtListenerStatus || 'unknown',
      responseLength: data.text.length,
      elapsed: `${elapsed}ms`
    });

    return { 
      text: data.text,
      citations: data.citations || [],
      hasKnowledgeBase: data.hasKnowledgeBase || false,
      documentsFound: data.documentsFound || 0,
      verifiedCases: data.verifiedCases || 0,
      courtListenerCitations: data.courtListenerCitations || 0
    };
  } catch (err: any) {
    console.error("Error in 3-agent quick consult:", err);
    
    // Provide more specific error handling
    let errorMessage = err.message || "Unknown error occurred";
    
    if (err.name === 'AbortError') {
      errorMessage = "Request was cancelled";
    } else if (err.message?.includes('fetch')) {
      errorMessage = "Network error - please check your connection";
    } else if (err.message?.includes('JSON')) {
      errorMessage = "Invalid response from server";
    }
    
    return { text: "", error: errorMessage };
  }
};