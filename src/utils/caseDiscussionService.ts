
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

// Type for case discussion messages
export interface CaseDiscussionMessage {
  id?: string;
  client_id: string;
  user_id: string;
  content: string;
  role: "attorney" | "ai";
  timestamp: string;
  created_at?: string;
}

// Generate case discussion response with AI
export const generateCaseDiscussionResponse = async (
  clientId: string,
  message: string,
  previousMessages: CaseDiscussionMessage[]
): Promise<{ response: string; timestamp: string; error?: string }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      return { response: "", timestamp: "", error: "User not authenticated" };
    }

    console.log(`Invoking edge function for client: ${clientId}`);
    
    // Make sure we're passing the clientId properly
    const { data, error } = await supabase.functions.invoke("generate-case-discussion-response", {
      body: {
        clientId,
        message,
        previousMessages,
        userId
      },
    });

    if (error) {
      console.error("Error calling generate-case-discussion-response:", error);
      return { response: "", timestamp: "", error: error.message };
    }

    return {
      response: data.response || "",
      timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err: any) {
    console.error("Error generating case discussion response:", err);
    return { response: "", timestamp: "", error: err.message };
  }
};

// Get all case discussion messages for a client
export const getCaseDiscussionMessages = async (
  clientId: string
): Promise<{ messages: CaseDiscussionMessage[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("case_discussions")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching case discussion messages:", error);
      return { messages: [], error: error.message };
    }

    return {
      messages: data as CaseDiscussionMessage[]
    };
  } catch (err: any) {
    console.error("Error fetching case discussion messages:", err);
    return { messages: [], error: err.message };
  }
};
