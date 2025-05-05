
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateChatCompletion, generateLegalAnalysis, Message as OpenAIMessage } from "@/utils/openaiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export interface AnalysisItem {
  content: string;
  timestamp: string;
}

export const useClientChat = (clientId: string) => {
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [legalAnalysis, setLegalAnalysis] = useState<AnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const { toast } = useToast();

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // In a real app, you would load chat history from the database
    // For now, we'll use empty arrays
    setMessages([]);
    setLegalAnalysis([]);
  }, [clientId]);

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      const timestamp = formatTimestamp();
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: activeTab
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);

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
            } as OpenAIMessage)),
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
        } catch (err: any) {
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
      } as OpenAIMessage));

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
    } catch (err: any) {
      console.error("Error generating legal analysis:", err);
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    messages,
    legalAnalysis,
    isLoading,
    isAnalysisLoading,
    handleSendMessage,
    formatTimestamp
  };
};
