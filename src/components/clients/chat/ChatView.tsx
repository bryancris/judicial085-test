
import React from "react";
import { Loader2 } from "lucide-react";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";

interface ChatViewProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
}

const ChatView = ({ messages, isLoading }: ChatViewProps) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the interview by asking a question.
        </div>
      ) : (
        messages.map((msg, index) => (
          <ChatMessage key={index} {...msg} />
        ))
      )}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Client is typing...</span>
        </div>
      )}
    </div>
  );
};

export default ChatView;
