
import React, { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ChatMessage, { ChatMessageProps, MessageRole } from "./ChatMessage";
import { generateChatCompletion, generateLegalAnalysis, Message as OpenAIMessage } from "@/utils/openaiService";

interface ClientIntakeChatProps {
  clientId: string;
}

const ClientIntakeChat = ({ clientId }: ClientIntakeChatProps) => {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [legalAnalysis, setLegalAnalysis] = useState<{content: string, timestamp: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const { toast } = useToast();

  // Load initial messages
  useEffect(() => {
    // In a real app, you would load chat history from the database
    // For now, we'll use empty arrays
    setMessages([]);
    setLegalAnalysis([]);
  }, [clientId]);

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const timestamp = formatTimestamp();
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: activeTab
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);
      setMessage("");

      if (activeTab === "attorney") {
        // Generate AI response for attorney questions
        setIsLoading(true);
        
        try {
          // Convert chat messages to OpenAI format
          const openAIMessages: OpenAIMessage[] = [
            {
              role: "system",
              content: "You are a legal assistant helping an attorney conduct a client intake interview. Respond as if you are the client answering the attorney's questions based on previous context. Keep responses concise and conversational."
            },
            ...messages.map(msg => ({
              role: msg.role === "attorney" ? "user" : "assistant",
              content: msg.content
            })),
            {
              role: "user",
              content: message
            }
          ];

          const { text, error } = await generateChatCompletion(openAIMessages, clientId);
          
          if (error) {
            toast({
              title: "Error",
              description: "Failed to generate response. Please try again.",
              variant: "destructive",
            });
          } else if (text) {
            // Add AI response to chat
            const aiResponse: ChatMessageProps = {
              content: text,
              timestamp: formatTimestamp(),
              role: "client"
            };
            setMessages(prev => [...prev, aiResponse]);
            
            // Generate legal analysis after new exchange
            generateAnalysis([...messages, newMessage, aiResponse]);
          }
        } catch (err) {
          console.error("Error in chat completion:", err);
          toast({
            title: "Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const generateAnalysis = async (currentMessages: ChatMessageProps[]) => {
    setIsAnalysisLoading(true);
    
    try {
      // Convert chat messages to OpenAI format
      const conversation: OpenAIMessage[] = currentMessages.map(msg => ({
        role: msg.role === "attorney" ? "user" : "assistant",
        content: msg.content
      }));

      const { analysis, error } = await generateLegalAnalysis(clientId, conversation);
      
      if (error) {
        console.error("Error generating analysis:", error);
      } else if (analysis) {
        setLegalAnalysis(prev => [
          ...prev,
          {
            content: analysis,
            timestamp: formatTimestamp()
          }
        ]);
      }
    } catch (err) {
      console.error("Error generating legal analysis:", err);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-400px)] min-h-[500px]">
      {/* Attorney Input Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-primary text-primary-foreground p-3">
          <h3 className="font-medium">Attorney Input</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 bg-card">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Start the interview by asking a question.
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage key={index} {...msg} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Client is typing...</span>
            </div>
          )}
        </div>
        <div className="border-t p-3 bg-background">
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className={activeTab === "attorney" ? "bg-muted" : ""}
              onClick={() => setActiveTab("attorney")}
            >
              <span className="flex items-center gap-1">
                Attorney Question
              </span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={activeTab === "client" ? "bg-muted" : ""}
              onClick={() => setActiveTab("client")}
            >
              <span className="flex items-center gap-1">
                Client Response
              </span>
            </Button>
          </div>
          <div className="flex">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter your ${activeTab === "attorney" ? "question to the client" : "response as client"}...`}
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
              {activeTab === "attorney" ? "Ask Question" : "Send Response"}
            </Button>
          </div>
        </div>
      </div>

      {/* Legal Analysis Side */}
      <div className="flex flex-col border rounded-lg overflow-hidden">
        <div className="bg-brand-burgundy text-white p-3">
          <h3 className="font-medium">Legal Analysis</h3>
          <div className="text-xs opacity-80">{formatTimestamp()}</div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 bg-card">
          {legalAnalysis.length === 0 && !isAnalysisLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Legal analysis will appear here as you conduct the interview.
            </div>
          ) : (
            legalAnalysis.map((item, index) => (
              <div key={index} className="mb-6">
                <p className="whitespace-pre-wrap">{item.content}</p>
                <div className="text-xs text-muted-foreground mt-1">{item.timestamp}</div>
              </div>
            ))
          )}
          {isAnalysisLoading && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating legal analysis...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientIntakeChat;
