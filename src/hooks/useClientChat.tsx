
import { useState } from "react";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { useClientChatMessages } from "@/hooks/useClientChatMessages";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";

export type { AnalysisItem } from "@/hooks/useClientChatHistory";

export const useClientChat = (clientId: string) => {
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
    analysisError,
    generateAnalysis
  } = useClientChatAnalysis(clientId, setLegalAnalysis);
  
  const {
    isLoading,
    prefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp,
    activeTab,
    setActiveTab,
    interviewMode,
    setInterviewMode
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
    analysisError,
    prefilledMessage,
    handleSendMessage: handleSendMessageWithActiveTab,
    handleFollowUpQuestionClick,
    formatTimestamp,
    interviewMode,
    setInterviewMode
  };
};
