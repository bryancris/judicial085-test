
import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

// Save a message to the database
export const saveMessage = async (
  clientId: string,
  content: string,
  role: "attorney" | "client" | "facts",
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

// Get messages for a client
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
      role: msg.role as "attorney" | "client" | "facts"
    }));

    return { messages: formattedMessages };
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    return { messages: [], error: err.message };
  }
};
