
import { useState } from "react";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { useClientChatMessages } from "@/hooks/useClientChatMessages";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";

export type { AnalysisItem } from "@/hooks/useClientChatHistory";

export const useClientChat = (clientId: string) => {
  // We will no longer need this state since it's managed in the useClientChatMessages hook
  // const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");
  
  // Use our hooks
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
    formatTimestamp,
    activeTab,
    setActiveTab
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
