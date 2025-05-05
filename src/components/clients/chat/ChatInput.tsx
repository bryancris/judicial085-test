import React, { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  activeTab: "attorney" | "client";
  onTabChange: (tab: "attorney" | "client") => void;
  prefilledMessage?: string;
}

const ChatInput = ({ 
  onSendMessage, 
  isLoading, 
  activeTab, 
  onTabChange,
  prefilledMessage = "" 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  
  // Update message when prefilledMessage changes
  useEffect(() => {
    if (prefilledMessage) {
      setMessage(prefilledMessage);
      console.log("Prefilled message set:", prefilledMessage);
    }
  }, [prefilledMessage]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t p-3 bg-background">
      <div className="flex items-center mb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className={activeTab === "attorney" ? "bg-muted" : ""}
          onClick={() => onTabChange("attorney")}
        >
          <span className="flex items-center gap-1">
            Attorney
          </span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className={activeTab === "client" ? "bg-muted" : ""}
          onClick={() => onTabChange("client")}
        >
          <span className="flex items-center gap-1">
            Client
          </span>
        </Button>
      </div>
      <div className="flex">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Enter ${activeTab === "attorney" ? "attorney's question" : "client's response"}...`}
          className="min-h-[80px] resize-none flex-grow"
          disabled={isLoading}
        />
        <Button 
          className="ml-2 self-end"
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          Send as {activeTab === "attorney" ? "Attorney" : "Client"}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
