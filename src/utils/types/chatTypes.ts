
export type MessageRole = "system" | "assistant" | "user";

export interface Message {
  role: MessageRole;
  content: string;
}
