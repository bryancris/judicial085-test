
import React from "react";
import { User, UserRound } from "lucide-react";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

interface ConversationMessageItemProps {
  message: ChatMessageProps;
}

const ConversationMessageItem: React.FC<ConversationMessageItemProps> = ({ message }) => {
  return (
    <div className="py-2 border-b last:border-b-0 border-gray-100">
      <div className="flex items-center mb-1">
        {message.role === 'attorney' ? (
          <User className="h-4 w-4 mr-1 text-primary" />
        ) : (
          <UserRound className="h-4 w-4 mr-1 text-brand-burgundy" />
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded-full mr-2 ${
          message.role === 'attorney' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-brand-burgundy/10 text-brand-burgundy'
        }`}>
          {message.role === 'attorney' ? 'Attorney' : 'Client'}
        </span>
        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
      </div>
      <p className="text-sm pl-6">{message.content}</p>
    </div>
  );
};

export default ConversationMessageItem;
