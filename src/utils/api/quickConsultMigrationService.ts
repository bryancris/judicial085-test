import { supabase } from "@/integrations/supabase/client";
import { QuickConsultMessage } from "./quickConsultService";

/**
 * Migrates Quick Consult messages to client intake chat format
 * Maps message roles:
 * - "user" (attorney in Quick Consult) -> "attorney" (in client intake)
 * - "assistant" (AI in Quick Consult) -> "client" (representing client perspective)
 */
export const migrateQuickConsultMessages = async (
  messages: QuickConsultMessage[],
  clientId: string,
  userId: string,
  caseId?: string
): Promise<void> => {
  if (messages.length === 0) {
    return;
  }

  // Transform messages to client intake format
  const clientMessages = messages.map((message, index) => ({
    client_id: clientId,
    user_id: userId,
    case_id: caseId || null,
    content: message.content,
    role: message.role === "user" ? "attorney" : "client", // Map roles appropriately
    timestamp: message.timestamp,
    created_at: new Date(Date.now() + index * 1000).toISOString(), // Ensure chronological order
  }));

  // Insert messages into client_messages table
  const { error } = await supabase
    .from("client_messages")
    .insert(clientMessages);

  if (error) {
    console.error("Error migrating messages:", error);
    throw new Error(`Failed to migrate chat messages: ${error.message}`);
  }

  console.log(`Successfully migrated ${messages.length} messages to client intake chat`);
};