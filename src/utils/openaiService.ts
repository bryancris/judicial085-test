import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { SimilarCase } from "@/components/case-analysis/SimilarCasesDialog";

export type MessageRole = "system" | "assistant" | "user";

export interface Message {
  role: MessageRole;
  content: string;
}

// Keep this function for backward compatibility
export const generateChatCompletion = async (
  messages: Message[],
  clientId: string
): Promise<{ text: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("generate-chat-completion", {
      body: { messages, clientId },
    });

    if (error) {
      console.error("Error calling OpenAI:", error);
      return { text: "", error: error.message };
    }

    return { text: data.text || "" };
  } catch (err: any) {
    console.error("Error generating chat completion:", err);
    return { text: "", error: err.message };
  }
};

export const generateLegalAnalysis = async (
  clientId: string, 
  conversation: ChatMessageProps[]
): Promise<{ analysis: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("generate-legal-analysis", {
      body: { clientId, conversation },
    });

    if (error) {
      console.error("Error generating legal analysis:", error);
      return { analysis: "", error: error.message };
    }

    return { analysis: data.analysis || "" };
  } catch (err: any) {
    console.error("Error generating legal analysis:", err);
    return { analysis: "", error: err.message };
  }
};

// New function to search for similar cases
export const searchSimilarCases = async (
  clientId: string
): Promise<{ similarCases: SimilarCase[]; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("search-similar-cases", {
      body: { clientId },
    });

    if (error) {
      console.error("Error searching for similar cases:", error);
      return { similarCases: [], error: error.message };
    }

    return { similarCases: data.similarCases || [] };
  } catch (err: any) {
    console.error("Error searching for similar cases:", err);
    return { similarCases: [], error: err.message };
  }
};

// New function to save a message to the database
export const saveMessage = async (
  clientId: string,
  content: string,
  role: "attorney" | "client",
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("client_messages").insert({
      client_id: clientId,
      content,
      role,
      timestamp,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      console.error("Error saving message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving message:", err);
    return { success: false, error: err.message };
  }
};

// New function to save legal analysis to the database
export const saveLegalAnalysis = async (
  clientId: string,
  content: string,
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("legal_analyses").insert({
      client_id: clientId,
      content,
      timestamp,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (error) {
      console.error("Error saving legal analysis:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saving legal analysis:", err);
    return { success: false, error: err.message };
  }
};

// New function to get messages for a client
export const getClientMessages = async (
  clientId: string
): Promise<{ messages: ChatMessageProps[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("client_messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return { messages: [], error: error.message };
    }

    const formattedMessages: ChatMessageProps[] = data.map(msg => ({
      content: msg.content,
      timestamp: msg.timestamp,
      role: msg.role as "attorney" | "client"
    }));

    return { messages: formattedMessages };
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    return { messages: [], error: err.message };
  }
};

// New function to get legal analyses for a client
export const getClientLegalAnalyses = async (
  clientId: string
): Promise<{ analyses: { content: string; timestamp: string }[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("legal_analyses")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching legal analyses:", error);
      return { analyses: [], error: error.message };
    }

    const formattedAnalyses = data.map(analysis => ({
      content: analysis.content,
      timestamp: analysis.timestamp
    }));

    return { analyses: formattedAnalyses };
  } catch (err: any) {
    console.error("Error fetching legal analyses:", err);
    return { analyses: [], error: err.message };
  }
};
