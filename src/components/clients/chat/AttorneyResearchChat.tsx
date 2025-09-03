import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, UserPlus, Mic, MicOff } from "lucide-react";
import { useQuickConsult } from "@/hooks/useQuickConsult";
import { useQuickConsultSessions } from "@/hooks/useQuickConsultSessions";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { processMarkdown } from "@/utils/markdownProcessor";
import { AttorneyResearchExportButton } from "@/components/attorney-research/export/AttorneyResearchExportButton";
import CreateClientFromAttorneyResearchDialog from "@/components/clients/CreateClientFromAttorneyResearchDialog";
import AttorneyResearchSidebar from "./AttorneyResearchSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

interface AttorneyResearchChatProps {
  isMobile?: boolean;
  showSidebar?: boolean;
  onCloseSidebar?: () => void;
}

const AttorneyResearchChat = ({ 
  isMobile = false, 
  showSidebar = false, 
  onCloseSidebar 
}: AttorneyResearchChatProps = {}) => {
  const [input, setInput] = useState("");
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const { 
    sessions, 
    currentSessionId, 
    createNewSession, 
    updateSession, 
    deleteSession, 
    selectSession,
    isLoading: sessionsLoading
  } = useQuickConsultSessions();
  const { messages, isLoading, sendMessage, clearMessages } = useQuickConsult(undefined, currentSessionId || undefined, createNewSession);
  
  const { isRecording, isRequestingPermission, isSupported, toggleRecording } = useVoiceInput();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Update session with latest message when messages change
    if (currentSessionId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const firstUserMessage = messages.find(m => m.role === 'user');
      updateSession(
        currentSessionId, 
        firstUserMessage?.content.slice(0, 50) + (firstUserMessage?.content.length > 50 ? '...' : ''),
        lastMessage.content.slice(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
      );
    }
  }, [messages, currentSessionId, updateSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    console.log("Quick Consult: Form submitted", { hasInput: !!input.trim(), currentSessionId, isLoading });
    
    // Send message - it will handle session creation internally if needed
    await sendMessage(input);
    setInput("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = async () => {
    // Check if current session is empty
    if (currentSessionId && messages.length === 0) {
      // Already in an empty session, just clear it
      clearMessages();
      return;
    }
    
    // Check if there's an existing empty session with "New Chat" title
    const existingEmptySession = sessions.find(session => 
      session.title === "New Chat" && 
      session.lastMessage === ""
    );
    
    if (existingEmptySession) {
      // Select the existing empty session instead of creating a new one
      selectSession(existingEmptySession.id);
      clearMessages();
      return;
    }
    
    // No empty session exists, create a new one
    await createNewSession();
    clearMessages();
  };

  const handleClearChat = () => {
    clearMessages();
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      // Starting recording - blur textarea to prevent OS keyboard interference
      textareaRef.current?.blur();
    }
    
    toggleRecording((text) => {
      setInput(text);
      // Re-focus textarea when recording stops (next tick to ensure state updated)
      if (isRecording) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    });
  };

  const handleCreateClient = () => {
    setShowCreateClientDialog(true);
  };

  const handleClientCreated = () => {
    setShowCreateClientDialog(false);
    // Clear current chat after successful client creation
    clearMessages();
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      {(!isMobile || showSidebar) && (
        <AttorneyResearchSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={selectSession}
          onNewChat={handleNewChat}
          onSessionDelete={deleteSession}
          isMobile={isMobile}
          isOpen={showSidebar}
          onClose={onCloseSidebar}
        />
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Attorney Research Assistant</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleCreateClient}
                disabled={messages.length === 0}
              >
                <UserPlus className="h-4 w-4" />
                Create Client
              </Button>
              {messages.length > 0 && currentSessionId && (
                <AttorneyResearchExportButton 
                  sessionId={currentSessionId} 
                  disabled={isLoading}
                />
              )}
              {messages.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearChat}>
                  Clear Chat
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-4">
            {sessionsLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>Loading sessions...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <h3 className="text-lg font-medium mb-2">Welcome to Attorney Research Assistant</h3>
                <p>Start a conversation by typing your legal research question below.</p>
                <div className="mt-4 max-w-2xl mx-auto">
                  <LegalDisclaimer variant="prominent" />
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted border text-foreground'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </div>
                    ) : (
                      <div 
                        className="legal-analysis-content prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: processMarkdown(message.content)
                        }} 
                      />
                    )}
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-emerald-100' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted border rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a legal research question..."
                className={`flex-1 min-h-[48px] max-h-32 resize-none border-2 focus:border-emerald-500 rounded-xl ${
                  isRecording ? 'border-red-500 border-2' : ''
                }`}
                disabled={isLoading}
              />
              {isSupported && (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleVoiceToggle}
                  className={`h-12 w-12 rounded-xl ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  disabled={isLoading}
                  title={isRecording ? "Stop recording" : "Start voice input"}
                >
                  {isRequestingPermission ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-5 w-5 text-white" />
                  ) : (
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              )}
              <Button 
                type="submit" 
                size="icon"
                className="h-12 w-12 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              {isSupported && "Click the microphone to use voice input • "}
              Research can take up to ~1 minute • Shift + Enter for new line • Attorney review required for all AI output
            </div>
          </div>
        </div>
      </div>
      
      {/* Create Client Dialog */}
      <CreateClientFromAttorneyResearchDialog
        open={showCreateClientDialog}
        onOpenChange={setShowCreateClientDialog}
        messages={messages}
        onSuccess={handleClientCreated}
      />
    </div>
  );
};

export default AttorneyResearchChat;