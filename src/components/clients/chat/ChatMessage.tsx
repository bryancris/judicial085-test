
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type MessageRole = "attorney" | "client" | "facts";

export interface ChatMessageProps {
  content: string;
  timestamp: string;
  role: MessageRole;
}

const ChatMessage = ({ content, timestamp, role }: ChatMessageProps) => {
  const isAttorney = role === "attorney";
  const isClient = role === "client";
  const isFacts = role === "facts";
  
  // For facts, we'll style it similar to attorney but with a different avatar
  const displayRole = isFacts ? "Facts" : (isAttorney ? "Attorney" : "Client");
  const avatarLetter = isFacts ? "F" : (isAttorney ? "A" : "C");
  
  return (
    <div className={cn(
      "flex mb-4",
      (isAttorney || isFacts) ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex flex-col max-w-[80%]",
        (isAttorney || isFacts) ? "items-start" : "items-end"
      )}>
        <div className="flex items-center mb-1">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback className={cn(
              (isAttorney || isFacts) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}>
              {avatarLetter}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {displayRole}
          </span>
        </div>
        
        <div className={cn(
          "rounded-lg px-4 py-3",
          (isAttorney || isFacts) ? "bg-muted text-foreground" : "bg-primary/10 text-foreground",
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
