import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Send, Loader2, SidebarClose, SidebarOpen } from "lucide-react";
import { useQuickConsultSessions } from "@/hooks/useQuickConsultSessions";
import { useQuickConsultMessages } from "@/hooks/useQuickConsultMessages";
import { sendQuickConsultMessage } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";
import QuickConsultSidebar from "./QuickConsultSidebar";

const QuickConsultChat = () => {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();

  const { createSession, updateSessionTitle } = useQuickConsultSessions();
  const { messages, addMessage, clearMessages } = useQuickConsultMessages(currentSessionId);

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      setCurrentSessionId(sessionId);
      clearMessages();
    }
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const generateSessionTitle = (userMessage: string): string => {
    // Generate a concise title from the first user message
    const words = userMessage.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (words.length === 6 ? "..." : "");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = await createSession("New Chat");
      if (!sessionId) return;
      setCurrentSessionId(sessionId);
    }

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Add user message to database
      await addMessage(userMessageContent, "user");

      // Generate session title from first message if it's still "New Chat"
      if (messages.length === 0) {
        const title = generateSessionTitle(userMessageContent);
        await updateSessionTitle(sessionId, title);
      }

      // Get all messages for this session to send to AI
      const allMessages = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString()
        })),
        { role: "user" as const, content: userMessageContent, timestamp: new Date().toLocaleTimeString() }
      ];

      // Send to AI service
      const { text, error } = await sendQuickConsultMessage(allMessages);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      // Add AI response to database
      await addMessage(text, "assistant");

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (currentSessionId) {
      clearMessages();
      // Optionally delete the session or just clear messages
    }
  };

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId) {
      handleNewChat();
    }
  }, []);

  return (
    <div className="h-full flex">
      <QuickConsultSidebar
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col m-0 rounded-none border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {sidebarCollapsed ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
                </Button>
                <CardTitle className="text-xl text-teal-700">Quick Consult</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Chat
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="max-w-md">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-teal-600">⚖️</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to Quick Consult
                    </h3>
                    <p className="text-gray-500">
                      Ask me any legal questions and I'll help provide insights and guidance. 
                      I can assist with case analysis, legal research, and general legal advice.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-teal-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="text-sm mb-1">
                          <strong>{message.role === "user" ? "You" : "AI Assistant"}</strong>
                          <span className="text-xs opacity-70 ml-2">
                            {new Date(message.created_at || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="border-t p-4 bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a legal question..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickConsultChat;