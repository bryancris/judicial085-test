
import { useState } from "react";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { useClientChatMessages } from "@/hooks/useClientChatMessages";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";

export type { AnalysisItem } from "@/hooks/useClientChatHistory";

export const useClientChat = (clientId: string) => {
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");
  
  // Use our new hooks
  const {
    messages,
    setMessages,
    legalAnalysis,
    setLegalAnalysis,
    isLoadingHistory
  } = useClientChatHistory(clientId);
  
  const {
    isAnalysisLoading,
    generateAnalysis
  } = useClientChatAnalysis(clientId, setLegalAnalysis);
  
  const {
    isLoading,
    prefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp
  } = useClientChatMessages(clientId, messages, setMessages, generateAnalysis);

  // Create the main message handler with the current active tab
  const handleSendMessageWithActiveTab = (message: string) => {
    return handleSendMessage(message, activeTab);
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
    handleSendMessage: handleSendMessageWithActiveTab,
    handleFollowUpQuestionClick,
    formatTimestamp
  };
};
