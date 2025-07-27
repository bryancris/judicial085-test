
/**
 * MESSAGE API SERVICE
 * 
 * This service handles all database operations for chat messages in the client intake system.
 * It provides a clean abstraction layer over Supabase operations for message persistence.
 * 
 * Key Operations:
 * - Save new messages to the database
 * - Retrieve all messages for a specific client
 * - Handle error conditions and return user-friendly error messages
 * 
 * Database Table: client_messages
 * Schema: id, client_id, content, role, timestamp, user_id, created_at
 * 
 * Integration:
 * - Used by useClientChatMessages for message persistence
 * - Used by useClientChatHistory for loading existing messages
 */

import { supabase } from "@/integrations/supabase/client";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

/**
 * SAVE MESSAGE TO DATABASE
 * 
 * Persists a new chat message to the client_messages table.
 * 
 * Parameters:
 * @param clientId - Unique client identifier for message association
 * @param content - The actual message text
 * @param role - Message sender role: "attorney" | "client" | "facts"
 * @param timestamp - UI display timestamp (formatted string)
 * 
 * Returns:
 * @returns Promise<{ success: boolean; error?: string }> - Operation result
 * 
 * Database Fields:
 * - client_id: Links message to specific client
 * - content: Message text content
 * - role: Sender role for UI display and analysis
 * - timestamp: Display timestamp (from client)
 * - user_id: Current authenticated user (for multi-user support)
 * - created_at: Database timestamp (automatic)
 */
export const saveMessage = async (
  clientId: string,
  content: string,
  role: "attorney" | "client" | "facts",
  timestamp: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    /**
     * DATABASE INSERT OPERATION
     * 
     * Insert new message with proper user association.
     * The user_id ensures messages are tied to the current authenticated user.
     */
    const { error } = await supabase.from("client_messages").insert({
      client_id: clientId,     // Associate with specific client
      content,                 // Message text
      role,                    // Sender role for display
      timestamp,               // UI timestamp
      user_id: (await supabase.auth.getUser()).data.user?.id  // Current user
    });

    /**
     * ERROR HANDLING
     * 
     * Database errors are returned with user-friendly messages.
     * The error object contains detailed information for debugging.
     */
    if (error) {
      console.error("Error saving message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    /**
     * EXCEPTION HANDLING
     * 
     * Catch unexpected errors (network issues, auth failures, etc.)
     */
    console.error("Error saving message:", err);
    return { success: false, error: err.message };
  }
};

/**
 * RETRIEVE CLIENT MESSAGES
 * 
 * Fetches all messages for a specific client from the database.
 * Messages are returned in chronological order for proper conversation flow.
 * 
 * Parameters:
 * @param clientId - Unique client identifier
 * 
 * Returns:
 * @returns Promise<{ messages: ChatMessageProps[]; error?: string }> - Messages or error
 * 
 * Data Transformation:
 * - Database format → UI format (ChatMessageProps)
 * - Ordered by created_at (oldest first) for conversation flow
 * - Role field cast to proper TypeScript union type
 */
export const getClientMessages = async (
  clientId: string
): Promise<{ messages: ChatMessageProps[]; error?: string }> => {
  try {
    /**
     * DATABASE QUERY
     * 
     * Fetch all messages for the client in chronological order.
     * The ascending order ensures conversation flows naturally from old to new.
     */
    const { data, error } = await supabase
      .from("client_messages")
      .select("*")                              // Get all fields
      .eq("client_id", clientId)                // Filter by client
      .order("created_at", { ascending: true }); // Chronological order

    /**
     * ERROR HANDLING
     * 
     * Return empty array on error to prevent UI crashes.
     * Error message is passed through for user notification.
     */
    if (error) {
      console.error("Error fetching messages:", error);
      return { messages: [], error: error.message };
    }

    /**
     * DATA TRANSFORMATION
     * 
     * Convert database format to UI format (ChatMessageProps).
     * Type casting ensures role field matches expected union type.
     */
    const formattedMessages: ChatMessageProps[] = data.map(msg => ({
      content: msg.content,
      timestamp: msg.timestamp,
      role: msg.role as "attorney" | "client" | "facts"  // Type safety
    }));

    return { messages: formattedMessages };
  } catch (err: any) {
    /**
     * EXCEPTION HANDLING
     * 
     * Catch unexpected errors and return safe fallback.
     */
    console.error("Error fetching messages:", err);
    return { messages: [], error: err.message };
  }
};
