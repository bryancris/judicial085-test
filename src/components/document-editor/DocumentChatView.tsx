import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface DocumentChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const DocumentChatView: React.FC<DocumentChatViewProps> = ({
  messages,
  isLoading
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <Card className={`max-w-[85%] p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground ml-8' 
                : 'bg-muted'
            }`}>
              <div className="text-sm leading-relaxed">
                {formatContent(message.content)}
              </div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>

            {message.role === 'user' && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-secondary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="bg-primary/10">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="bg-muted p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI is thinking...
              </div>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};