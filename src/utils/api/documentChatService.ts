import { invokeFunction } from "./baseApiService";

// Generate document-specific chat completion
export const generateDocumentChatCompletion = async (
  userMessage: string,
  documentTitle: string,
  documentContent: string,
  clientId: string
): Promise<{ text: string; error?: string }> => {
  try {
    const { data, error } = await invokeFunction<{ text: string }>("generate-document-chat-completion", { 
      userMessage,
      documentTitle,
      documentContent,
      clientId 
    });

    if (error) {
      return { text: "", error };
    }

    return { text: data?.text || "" };
  } catch (err: any) {
    console.error("Error generating document chat completion:", err);
    return { text: "", error: err.message };
  }
};