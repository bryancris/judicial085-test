import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Send, Loader2, SidebarClose, SidebarOpen, FileText, ChevronDown, ChevronRight, Mic, MicOff, UserPlus, Upload } from "lucide-react";
import { useQuickConsultSessions } from "@/hooks/useQuickConsultSessions";
import { useQuickConsultMessages } from "@/hooks/useQuickConsultMessages";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { sendQuickConsultMessage, QuickConsultResponse } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import QuickConsultSidebar from "./QuickConsultSidebar";
import CreateClientFromQuickConsultDialog from "../CreateClientFromQuickConsultDialog";
import QuickConsultDocumentUploadDialog from "../../quick-consult/QuickConsultDocumentUploadDialog";
import QuickConsultMessageContent from "../../quick-consult/QuickConsultMessageContent";

const QuickConsultChat = () => {
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastResponse, setLastResponse] = useState<QuickConsultResponse | null>(null);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const { toast } = useToast();
  const { session } = useAuthState();

  const { createSession, updateSessionTitle, deleteSession } = useQuickConsultSessions();
  const { messages, addMessage, validateSession, clearMessages } = useQuickConsultMessages(currentSessionId);
  const { isRecording, isRequestingPermission, isSupported, toggleRecording } = useVoiceInput();

  const handleNewChat = () => {
    setCurrentSessionId(null);
    clearMessages();
    setInput("");
    setLastResponse(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleSessionDelete = (sessionId: string) => {
    // If deleting the current session, clear the state
    if (sessionId === currentSessionId) {
      setCurrentSessionId(null);
      clearMessages();
      setLastResponse(null);
    }
    // The actual deletion is handled by the sidebar component
  };

  // Validate current session on component mount and when sessionId changes
  useEffect(() => {
    const validateCurrentSession = async () => {
      if (currentSessionId) {
        const isValid = await validateSession(currentSessionId);
        if (!isValid) {
          console.log("Current session is invalid, clearing state");
          setCurrentSessionId(null);
          clearMessages();
          setLastResponse(null);
        }
      }
    };
    
    validateCurrentSession();
  }, [currentSessionId, validateSession]);

  const generateSessionTitle = (userMessage: string): string => {
    // Generate a concise title from the first user message
    const words = userMessage.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (words.length === 6 ? "..." : "");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const userMessageContent = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Create session recovery/creation function
      const handleSessionCreation = async (): Promise<string | null> => {
        const title = generateSessionTitle(userMessageContent);
        const newSessionId = await createSession(title);
        if (newSessionId) {
          setCurrentSessionId(newSessionId);
          clearMessages();
        }
        return newSessionId;
      };

      // Add user message to database (will create session if needed)
      const userMessage = await addMessage(userMessageContent, "user", handleSessionCreation);
      if (!userMessage) {
        // Reset session if message failed to save
        setCurrentSessionId(null);
        clearMessages();
        return;
      }

      // Update sessionId if it was created
      const activeSessionId = userMessage.session_id;
      if (activeSessionId !== currentSessionId) {
        setCurrentSessionId(activeSessionId);
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

      // Send to AI service with enhanced response handling (include user ID for firm document search)
      const response = await sendQuickConsultMessage(allMessages, undefined, session?.user?.id);

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

      // Add AI response to database using the session ID from user message
      const aiMessage = await addMessage(response.text, "assistant", async () => activeSessionId);
      if (!aiMessage) {
        toast({
          title: "Error", 
          description: "Failed to save AI response",
          variant: "destructive",
        });
        return;
      }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("Key pressed:", e.key, "shiftKey:", e.shiftKey);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log("Enter pressed, calling handleSend");
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

  const handleCreateClient = (clientId: string, caseId: string) => {
    // Clear the current session after successful client creation
    setCurrentSessionId(null);
    setLastResponse(null);
    
    toast({
      title: "Success",
      description: "Client created and chat imported successfully",
    });
  };

  const handleVoiceInput = async () => {
    await toggleRecording((text) => {
      setInput(text);
    });
  };

  const handleDocumentUpload = () => {
    // Refresh sessions or perform any necessary updates
    console.log("Document uploaded to firm library");
  };

  const handleChatInitiated = (sessionId: string) => {
    // Switch to the new session that was created with the AI review
    setCurrentSessionId(sessionId);
    setSidebarCollapsed(true); // Collapse sidebar to show chat
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
        onSessionDelete={handleSessionDelete}
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Document
                </Button>
                {currentSessionId && messages.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setCreateClientDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Client
                  </Button>
                )}
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
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4 overflow-x-hidden">
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
                <div className="space-y-4 min-w-0">
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
                          className={`max-w-[80%] p-3 rounded-lg break-words overflow-hidden ${
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
                          <QuickConsultMessageContent 
                            content={message.content}
                            enableCitationLinks={message.role === "assistant"}
                          />
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
              onKeyDown={handleKeyDown}
              placeholder="Ask a legal question or use voice input..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleVoiceInput}
                disabled={!isSupported || isLoading}
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                className={`transition-colors ${
                  isRequestingPermission 
                    ? "animate-pulse" 
                    : isRecording 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : ""
                }`}
                title={
                  !isSupported 
                    ? "Voice input not supported" 
                    : isRecording 
                    ? "Stop recording" 
                    : "Start voice input"
                }
              >
                {isRequestingPermission ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                size="icon"
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

      <CreateClientFromQuickConsultDialog
        open={createClientDialogOpen}
        onOpenChange={setCreateClientDialogOpen}
        messages={messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at || Date.now()).toLocaleTimeString()
        }))}
        onSuccess={handleCreateClient}
      />

      <QuickConsultDocumentUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleDocumentUpload}
        onChatInitiated={handleChatInitiated}
      />
    </div>
  );
};

export default QuickConsultChat;