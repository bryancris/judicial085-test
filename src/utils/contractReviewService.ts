
import { supabase } from "@/integrations/supabase/client";

// Type for contract review messages
export interface ContractReviewMessage {
  id?: string;
  client_id: string;
  user_id: string;
  content: string;
  role: "attorney" | "ai";
  timestamp: string;
  created_at?: string;
}

// Generate contract review response with AI
export const generateContractReviewResponse = async (
  clientId: string,
  message: string,
  previousMessages: ContractReviewMessage[]
): Promise<{ response: string; timestamp: string; error?: string }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      return { response: "", timestamp: "", error: "User not authenticated" };
    }

    // For now, return a placeholder response since the edge function isn't implemented yet
    const placeholderResponse = "This is a placeholder response for contract review. The actual AI integration will be implemented in the future.";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Demo: Save attorney message and AI response in the database
    await saveContractReviewMessage(clientId, userId, message, "attorney", timestamp);
    await saveContractReviewMessage(clientId, userId, placeholderResponse, "ai", timestamp);

    return {
      response: placeholderResponse,
      timestamp
    };
  } catch (err: any) {
    console.error("Error generating contract review response:", err);
    return { 
      response: "I'm sorry, I encountered an unexpected error. Please try again later.", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      error: err.message 
    };
  }
};

// Save a message to the database
export const saveContractReviewMessage = async (
  clientId: string,
  userId: string,
  content: string,
  role: "attorney" | "ai",
  timestamp: string
): Promise<{ error?: string }> => {
  try {
    // Using explicitly typed insert to avoid TypeScript errors with new tables
    const { error } = await supabase
      .from('contract_reviews')
      .insert({
        client_id: clientId,
        user_id: userId,
        content,
        role,
        timestamp
      } as any);

    if (error) {
      console.error("Error saving contract review message:", error);
      return { error: error.message };
    }

    return {};
  } catch (err: any) {
    console.error("Error saving contract review message:", err);
    return { error: err.message };
  }
};

// Get all contract review messages for a client
export const getContractReviewMessages = async (
  clientId: string
): Promise<{ messages: ContractReviewMessage[]; error?: string }> => {
  try {
    // Using explicitly typed from to avoid TypeScript errors with new tables
    const { data, error } = await supabase
      .from('contract_reviews' as any)
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching contract review messages:", error);
      return { messages: [], error: error.message };
    }

    return {
      messages: data as ContractReviewMessage[]
    };
  } catch (err: any) {
    console.error("Error fetching contract review messages:", err);
    return { messages: [], error: err.message };
  }
};
