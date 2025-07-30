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
    const { data, error } = await invokeFunction<{
      text: string;
      usage?: any;
      citations?: any[];
      hasKnowledgeBase?: boolean;
      documentsFound?: number;
      verifiedCases?: number;
      courtListenerCitations?: number;
    }>("quick-consult-ai", { 
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      clientId,
      userId
    });

    if (error) {
      return { text: "", error };
    }

    return { 
      text: data?.text || "",
      citations: data?.citations || [],
      hasKnowledgeBase: data?.hasKnowledgeBase || false,
      documentsFound: data?.documentsFound || 0,
      verifiedCases: data?.verifiedCases || 0,
      courtListenerCitations: data?.courtListenerCitations || 0
    };
  } catch (err: any) {
    console.error("Error in quick consult:", err);
    return { text: "", error: err.message };
  }
};