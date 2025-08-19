
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesDialog";
import { invokeFunction } from "./baseApiService";

// Generate legal analysis based on conversation or documents
export const generateLegalAnalysis = async (
  clientId: string, 
  conversation: ChatMessageProps[],
  caseId?: string,
  requestContext?: string
): Promise<{ 
  analysis: string; 
  lawReferences?: any[]; 
  documentsUsed?: any[];
  error?: string 
}> => {
  try {
    console.log("Calling generate-legal-analysis with:", { clientId, caseId, conversationLength: conversation.length, requestContext });
    
    const { data, error } = await invokeFunction<{ 
      analysis: string; 
      lawReferences?: any[];
      documentsUsed?: any[];
      caseType?: string;
    }>(
      "generate-legal-analysis", 
      { clientId, conversation, caseId, requestContext }
    );

    if (error) {
      console.error("Analysis generation API error:", error);
      return { analysis: "", error };
    }

    console.log("Analysis generation successful, response:", { 
      hasAnalysis: !!data?.analysis,
      analysisLength: data?.analysis?.length || 0,
      lawReferencesCount: data?.lawReferences?.length || 0
    });

    return { 
      analysis: data?.analysis || "",
      lawReferences: data?.lawReferences || [],
      documentsUsed: data?.documentsUsed || []
    };
  } catch (err: any) {
    console.error("Error generating legal analysis:", err);
    return { analysis: "", error: err.message };
  }
};

// Enhanced search for similar cases using AI Agent Coordinator
export const searchSimilarCases = async (
  clientId: string
): Promise<{ 
  similarCases: SimilarCase[]; 
  error?: string;
  fallbackUsed?: boolean;
  analysisFound?: boolean;
}> => {
  try {
    console.log("🤖 Calling enhanced AI-powered search-similar-cases for client:", clientId);
    const { data, error } = await invokeFunction<{
      similarCases: SimilarCase[];
      fallbackUsed?: boolean;
      analysisFound?: boolean;
      searchStrategy?: string;
      aiMetadata?: any;
    }>("search-similar-cases", { clientId });

    if (error) {
      console.error("❌ Error in AI-powered similar cases search:", error);
      return { 
        similarCases: [], 
        error,
        fallbackUsed: false,
        analysisFound: false
      };
    }

    console.log("✅ Enhanced search-similar-cases response:", {
      casesFound: data?.similarCases?.length || 0,
      searchStrategy: data?.searchStrategy,
      analysisFound: data?.analysisFound
    });
    
    return { 
      similarCases: data?.similarCases || [],
      fallbackUsed: data?.fallbackUsed || false,
      analysisFound: data?.analysisFound !== false // default to true if not specifically false
    };
  } catch (err: any) {
    console.error("❌ Error in enhanced similar cases search:", err);
    return { 
      similarCases: [], 
      error: err.message,
      fallbackUsed: false,
      analysisFound: false
    };
  }
};
