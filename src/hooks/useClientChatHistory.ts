
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getClientMessages, getClientLegalAnalyses } from "@/utils/openaiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export interface AnalysisItem {
  content: string;
  timestamp: string;
}

export const useClientChatHistory = (clientId: string) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [legalAnalysis, setLegalAnalysis] = useState<AnalysisItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

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

  return {
    messages,
    setMessages,
    legalAnalysis,
    setLegalAnalysis,
    isLoadingHistory
  };
};
