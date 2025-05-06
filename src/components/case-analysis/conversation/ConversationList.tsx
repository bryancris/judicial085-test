
import React from "react";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import ConversationMessageItem from "./ConversationMessageItem";

interface ConversationListProps {
  conversation: ChatMessageProps[];
  loading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversation, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      </div>
    );
  }
  
  if (conversation.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">No conversation data available</p>
    );
  }
  
  return (
    <div className="space-y-2 border p-4 rounded-md bg-muted/30">
      {conversation.map((message, index) => (
        <ConversationMessageItem key={index} message={message} />
      ))}
    </div>
  );
};

export default ConversationList;
