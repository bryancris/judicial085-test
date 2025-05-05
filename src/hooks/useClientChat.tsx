
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  generateLegalAnalysis, 
  saveMessage, 
  saveLegalAnalysis,
  getClientMessages,
  getClientLegalAnalyses
} from "@/utils/openaiService";
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [prefilledMessage, setPrefilledMessage] = useState("");
  const { toast } = useToast();

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        // Load messages
        const { messages: chatMessages, error: messagesError } = await getClientMessages(clientId);
        if (messagesError) {
          toast({
            title: "Error loading messages",
            description: messagesError,
            variant: "destructive",
          });
        } else {
          setMessages(chatMessages);
        }

        // Load legal analyses
        const { analyses: legalAnalyses, error: analysesError } = await getClientLegalAnalyses(clientId);
        if (analysesError) {
          toast({
            title: "Error loading legal analyses",
            description: analysesError,
            variant: "destructive",
          });
        } else {
          setLegalAnalysis(legalAnalyses);
        }
      } catch (err: any) {
        console.error("Error loading chat history:", err);
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (clientId) {
      loadChatHistory();
    }
  }, [clientId, toast]);

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      setIsLoading(true);
      const timestamp = formatTimestamp();
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: activeTab
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);
      
      // Save message to database
      const { success, error } = await saveMessage(clientId, message, activeTab, timestamp);
      
      if (!success) {
        toast({
          title: "Error Saving Message",
          description: error || "Failed to save message to database.",
          variant: "destructive",
        });
      }
      
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

  const handleFollowUpQuestionClick = (question: string) => {
    setActiveTab("attorney");
    setPrefilledMessage(question);
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
      // Send the conversation to generate legal analysis
      const { analysis, error } = await generateLegalAnalysis(clientId, currentMessages);
      
      if (error) {
        console.error("Error generating analysis:", error);
        toast({
          title: "Analysis Error",
          description: "Failed to generate legal analysis. Please try again.",
          variant: "destructive",
        });
      } else if (analysis) {
        const timestamp = formatTimestamp();
        
        // Add analysis to state
        const newAnalysis = {
          content: analysis,
          timestamp
        };
        
        setLegalAnalysis(prev => [...prev, newAnalysis]);
        
        // Save analysis to database
        const { success, error: saveError } = await saveLegalAnalysis(clientId, analysis, timestamp);
        
        if (!success) {
          toast({
            title: "Error Saving Analysis",
            description: saveError || "Failed to save analysis to database.",
            variant: "destructive",
          });
        }
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
    isLoadingHistory,
    prefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp
  };
};
