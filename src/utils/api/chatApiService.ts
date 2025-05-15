
import { Message, MessageRole } from "../types/chatTypes";
import { invokeFunction } from "./baseApiService";

// Generate chat completion using OpenAI
export const generateChatCompletion = async (
  messages: Message[],
  clientId: string
): Promise<{ text: string; error?: string }> => {
  try {
    const { data, error } = await invokeFunction<{ text: string }>("generate-chat-completion", { 
      messages, 
      clientId 
    });

    if (error) {
      return { text: "", error };
    }

    return { text: data?.text || "" };
  } catch (err: any) {
    console.error("Error generating chat completion:", err);
    return { text: "", error: err.message };
  }
};
