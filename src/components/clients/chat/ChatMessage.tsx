
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MessageRole = "attorney" | "client";

export interface ChatMessageProps {
  content: string;
  timestamp: string;
  role: MessageRole;
}

const ChatMessage = ({ content, timestamp, role }: ChatMessageProps) => {
  const isAttorney = role === "attorney";
  
  return (
    <div className={cn(
      "flex mb-4",
      isAttorney ? "justify-start" : "justify-start"
    )}>
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isAttorney ? "items-start" : "items-start"
      )}>
        <div className="flex items-center mb-1">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback className={cn(
              isAttorney ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}>
              {isAttorney ? "A" : "C"}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {isAttorney ? "Attorney" : "Client"}
          </span>
        </div>
        
        <div className={cn(
          "rounded-lg px-4 py-3",
          isAttorney ? "bg-muted text-foreground" : "bg-muted text-foreground",
          "border border-border"
        )}>
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">{timestamp}</span>
      </div>
    </div>
  );
};

export default ChatMessage;
