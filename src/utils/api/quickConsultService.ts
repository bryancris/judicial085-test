import { invokeFunction } from "./baseApiService";

export interface QuickConsultMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const sendQuickConsultMessage = async (
  messages: QuickConsultMessage[]
): Promise<{ text: string; error?: string }> => {
  try {
    const { data, error } = await invokeFunction<{ text: string; usage?: any }>("quick-consult-ai", { 
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    if (error) {
      return { text: "", error };
    }

    return { text: data?.text || "" };
  } catch (err: any) {
    console.error("Error in quick consult:", err);
    return { text: "", error: err.message };
  }
};