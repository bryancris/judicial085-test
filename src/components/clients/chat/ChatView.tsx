
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ChatMessage, { ChatMessageProps } from "./ChatMessage";

interface ChatViewProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
}

const ChatView = ({ messages, isLoading }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 bg-card h-full">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Start the interview by asking a question as the attorney or providing a response as the client.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <ChatMessage key={index} {...msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default ChatView;
