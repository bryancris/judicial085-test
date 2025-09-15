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

    console.log('🎯 Quick Consult using OpenAI Direct Analysis:', { 
      query: userQuery.substring(0, 100) + '...', 
      clientId, 
      userId,
      messageCount: messages.length
    });

    const startTime = Date.now();
    
    const { data, error } = await invokeFunction<{
      analysis?: string;
      text?: string;
      lawReferences?: any[];
      citations?: any[];
      factSources?: any[];
      success?: boolean;
      analysisSource?: string;
      metadata?: any;
    }>("generate-legal-analysis", {
      clientId,
      conversation: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });

    const elapsed = Date.now() - startTime;
    console.log(`🕐 OpenAI Legal Analysis took ${elapsed}ms`);

    if (error) {
      console.error('OpenAI Quick Consult error:', error);
      
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
      console.error('OpenAI Quick Consult: No data returned');
      return { text: "", error: "No response from AI service" };
    }

    // Map analysis to text for compatibility
    const finalText = data.analysis || data.text || '';
    console.log(`🔄 Response mapping - analysis: ${data.analysis ? `present (${data.analysis.length} chars)` : 'missing'}, text: ${data.text ? 'present' : 'missing'}`);
    
    if (!finalText || finalText.trim().length === 0) {
      console.error('OpenAI Quick Consult: Empty response text after mapping');
      return { text: "", error: "NO_RESULTS" };
    }

    console.log('✅ OpenAI Quick Consult completed successfully:', {
      responseLength: finalText.length,
      citations: data.citations?.length || 0,
      lawReferences: data.lawReferences?.length || 0,
      analysisSource: data.analysisSource || 'unknown',
      elapsed: `${elapsed}ms`
    });

    return { 
      text: finalText,
      citations: data.citations || [],
      hasKnowledgeBase: (data.lawReferences?.length || 0) > 0,
      documentsFound: data.lawReferences?.length || 0,
      verifiedCases: 0, // OpenAI analysis doesn't verify cases
      courtListenerCitations: 0
    };
  } catch (err: any) {
    console.error("Error in OpenAI quick consult:", err);
    
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