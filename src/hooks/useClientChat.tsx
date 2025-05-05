
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis, Message as OpenAIMessage } from "@/utils/openaiService";
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
      
      try {
        // Generate legal analysis after new message is added
        const updatedMessages = [...messages, newMessage];
        await generateAnalysis(updatedMessages);
      } catch (err: any) {
        console.error("Error processing message:", err);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generateAnalysis = async (currentMessages: ChatMessageProps[]) => {
    // Only run analysis if we have at least one message from both attorney and client
    const hasAttorneyMessages = currentMessages.some(msg => msg.role === "attorney");
    const hasClientMessages = currentMessages.some(msg => msg.role === "client");
    
    if (!hasAttorneyMessages || !hasClientMessages) {
      return; // Don't generate analysis until we have both sides of the conversation
    }
    
    setIsAnalysisLoading(true);
    
    try {
      // Convert chat messages to OpenAI format
      const conversation: OpenAIMessage[] = currentMessages.map(msg => ({
        role: "user",
        content: `${msg.role.toUpperCase()}: ${msg.content}`
      } as OpenAIMessage));

      const { analysis, error } = await generateLegalAnalysis(clientId, conversation);
      
      if (error) {
        console.error("Error generating analysis:", error);
        toast({
          title: "Analysis Error",
          description: "Failed to generate legal analysis. Please try again.",
          variant: "destructive",
        });
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
      toast({
        title: "Analysis Error",
        description: "An unexpected error occurred while generating legal analysis.",
        variant: "destructive",
      });
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
