
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesDialog";
import { invokeFunction } from "./baseApiService";

// Generate legal analysis based on conversation
export const generateLegalAnalysis = async (
  clientId: string, 
  conversation: ChatMessageProps[]
): Promise<{ analysis: string; lawReferences?: any[]; error?: string }> => {
  try {
    const { data, error } = await invokeFunction<{ analysis: string; lawReferences?: any[] }>(
      "generate-legal-analysis", 
      { clientId, conversation }
    );

    if (error) {
      return { analysis: "", error };
    }

    return { 
      analysis: data?.analysis || "",
      lawReferences: data?.lawReferences || []
    };
  } catch (err: any) {
    console.error("Error generating legal analysis:", err);
    return { analysis: "", error: err.message };
  }
};

// Search for similar cases
export const searchSimilarCases = async (
  clientId: string
): Promise<{ 
  similarCases: SimilarCase[]; 
  error?: string;
  fallbackUsed?: boolean;
  analysisFound?: boolean;
}> => {
  try {
    console.log("Calling search-similar-cases function with clientId:", clientId);
    const { data, error } = await invokeFunction<{
      similarCases: SimilarCase[];
      fallbackUsed?: boolean;
      analysisFound?: boolean;
    }>("search-similar-cases", { clientId });

    if (error) {
      console.error("Error searching for similar cases:", error);
      return { 
        similarCases: [], 
        error,
        fallbackUsed: false,
        analysisFound: false
      };
    }

    console.log("Search-similar-cases response:", data);
    
    return { 
      similarCases: data?.similarCases || [],
      fallbackUsed: data?.fallbackUsed || false,
      analysisFound: data?.analysisFound !== false // default to true if not specifically false
    };
  } catch (err: any) {
    console.error("Error searching for similar cases:", err);
    return { 
      similarCases: [], 
      error: err.message,
      fallbackUsed: false,
      analysisFound: false
    };
  }
};
