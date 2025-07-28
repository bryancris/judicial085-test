import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2, Bot } from "lucide-react";
import { useQuickConsult } from "@/hooks/useQuickConsult";
import { cn } from "@/lib/utils";

const QuickConsultChat = () => {
  const [inputValue, setInputValue] = useState("");
  const { messages, isLoading, sendMessage, clearMessages } = useQuickConsult();

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    await sendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold">AI Legal Assistant</h3>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 p-4">
        <ScrollArea className="h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 text-teal-600" />
              <h4 className="text-lg font-medium mb-2">Quick Legal Consultation</h4>
              <p className="text-sm max-w-md">
                Ask me about legal research, document drafting, case analysis, or general legal questions. 
                I'm here to assist with your professional legal work.
              </p>
              <p className="text-xs mt-2 italic">
                Note: This is for informational assistance only, not legal advice.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex mb-4",
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  )}
                >
                  <div className={cn(
                    "flex flex-col max-w-[80%]",
                    message.role === "assistant" ? "items-start" : "items-end"
                  )}>
                    <div className="flex items-center mb-1">
                      {message.role === "assistant" && (
                        <Bot className="h-4 w-4 mr-2 text-teal-600" />
                      )}
                      <span className="text-sm font-medium">
                        {message.role === "assistant" ? "AI Assistant" : "You"}
                      </span>
                    </div>
                    
                    <div className={cn(
                      "rounded-lg px-4 py-3 border",
                      message.role === "assistant" 
                        ? "bg-teal-50 text-foreground border-teal-200" 
                        : "bg-primary/10 text-foreground border-border"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex flex-col items-start max-w-[80%]">
                    <div className="flex items-center mb-1">
                      <Bot className="h-4 w-4 mr-2 text-teal-600" />
                      <span className="text-sm font-medium">AI Assistant</span>
                    </div>
                    <div className="rounded-lg px-4 py-3 bg-teal-50 border border-teal-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about legal research, document drafting, case analysis..."
          className="flex-1 min-h-[80px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuickConsultChat;