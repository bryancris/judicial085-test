
import { supabase } from "@/integrations/supabase/client";

export type MessageRole = "system" | "assistant" | "user";

export interface Message {
  role: MessageRole;
  content: string;
}

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
  conversation: Message[]
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
