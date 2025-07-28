import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Send, Loader2, SidebarClose, SidebarOpen, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useQuickConsultSessions } from "@/hooks/useQuickConsultSessions";
import { useQuickConsultMessages } from "@/hooks/useQuickConsultMessages";
import { sendQuickConsultMessage, QuickConsultResponse } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";
import QuickConsultSidebar from "./QuickConsultSidebar";

const QuickConsultChat = () => {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastResponse, setLastResponse] = useState<QuickConsultResponse | null>(null);
  const { toast } = useToast();

  const { createSession, updateSessionTitle } = useQuickConsultSessions();
  const { messages, addMessage, validateSession, clearMessages } = useQuickConsultMessages(currentSessionId);

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
      // Create session recovery function
      const handleSessionRecovery = async (): Promise<string | null> => {
        console.log("Creating new session due to invalid session...");
        const newSessionId = await createSession("New Chat");
        if (newSessionId) {
          setCurrentSessionId(newSessionId);
          clearMessages();
          toast({
            title: "Session Recovered",
            description: "Created a new chat session and will retry your message",
            variant: "default",
          });
        }
        return newSessionId;
      };

      // Add user message to database with session recovery
      const userMessage = await addMessage(userMessageContent, "user", handleSessionRecovery);
      if (!userMessage) return;

      // Update sessionId if it was recovered
      const activeSessionId = userMessage.session_id;
      if (activeSessionId !== sessionId) {
        setCurrentSessionId(activeSessionId);
      }

      // Generate session title from first message if it's still "New Chat"
      if (messages.length === 0) {
        const title = generateSessionTitle(userMessageContent);
        await updateSessionTitle(activeSessionId, title);
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

      // Send to AI service with enhanced response handling
      const response = await sendQuickConsultMessage(allMessages);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Store the full response for citation display
      setLastResponse(response);

      // Add AI response to database with session recovery
      await addMessage(response.text, "assistant", handleSessionRecovery);

      // Show knowledge base usage notification
      if (response.hasKnowledgeBase && response.documentsFound && response.documentsFound > 0) {
        toast({
          title: "Knowledge Base Referenced",
          description: `Found ${response.documentsFound} relevant document(s)`,
          variant: "default",
        });
      }

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
      setLastResponse(null);
      // Optionally delete the session or just clear messages
    }
  };

  // Component to display citations
  const CitationsDisplay = ({ citations }: { citations: QuickConsultResponse['citations'] }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (!citations || citations.length === 0) return null;

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-2 text-xs text-muted-foreground hover:text-foreground">
            <FileText className="h-3 w-3 mr-1" />
            {citations.length} document reference{citations.length > 1 ? 's' : ''}
            {isOpen ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2">
          {citations.map((citation, index) => (
            <div key={citation.id} className="bg-background/50 border rounded-md p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{citation.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(citation.relevance * 100)}% relevant
                </Badge>
              </div>
              {citation.content_preview && (
                <p className="text-muted-foreground">{citation.content_preview}</p>
              )}
              <div className="flex items-center mt-1 text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {citation.type === 'knowledge_base' ? 'Knowledge Base' : citation.type}
                </Badge>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };


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
                      Ask me any legal questions and I'll help provide insights and guidance based on our knowledge base. 
                      I can assist with case analysis, legal research, document review, and general legal advice with citations to relevant sources.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isLastAssistantMessage = message.role === "assistant" && 
                      index === messages.length - 1;
                    const showCitations = isLastAssistantMessage && lastResponse?.citations;
                    const hasKnowledgeBase = isLastAssistantMessage && lastResponse?.hasKnowledgeBase;

                    return (
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
                          <div className="text-sm mb-1 flex items-center justify-between">
                            <div>
                              <strong>{message.role === "user" ? "You" : "AI Assistant"}</strong>
                              <span className="text-xs opacity-70 ml-2">
                                {new Date(message.created_at || Date.now()).toLocaleTimeString()}
                              </span>
                            </div>
                            {hasKnowledgeBase && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                <FileText className="h-3 w-3 mr-1" />
                                KB
                              </Badge>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {showCitations && (
                            <CitationsDisplay citations={lastResponse.citations} />
                          )}
                        </div>
                      </div>
                    );
                  })}

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