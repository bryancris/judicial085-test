
/**
 * CLIENT CHAT COMPOSITION HOOK
 * 
 * This is the main hook for the client intake system. It follows the composition pattern
 * by combining three specialized hooks into a single, cohesive interface.
 * 
 * Composition Pattern Benefits:
 * - Single point of integration for components
 * - Clear separation of concerns between sub-hooks
 * - Easier testing and maintenance
 * - Consistent state management across the chat system
 * 
 * Hook Composition:
 * 1. useClientChatHistory - Manages data persistence and loading
 * 2. useClientChatMessages - Handles message operations and UI state
 * 3. useClientChatAnalysis - Manages AI analysis generation
 * 
 * Integration Layer:
 * - Combines all hook outputs into a single return object
 * - Handles cross-hook dependencies (e.g., passing generateAnalysis to messages hook)
 * - Provides a unified API for components to consume
 */

import { useState, useEffect } from "react";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { useClientChatMessages } from "@/hooks/useClientChatMessages";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";

export type { AnalysisItem } from "@/hooks/useClientChatHistory";

export const useClientChat = (clientId: string) => {
  /**
   * HOOK COMPOSITION AND DATA FLOW
   * 
   * This hook orchestrates three specialized hooks with careful dependency management:
   * 
   * 1. HISTORY HOOK (Data Layer)
   *    - Loads messages and legal analyses from database
   *    - Provides setters for state updates
   *    - Manages loading states during data fetching
   * 
   * 2. ANALYSIS HOOK (AI Layer)
   *    - Generates legal analysis from conversation
   *    - Handles AI API communication
   *    - Manages analysis-specific loading and error states
   * 
   * 3. MESSAGES HOOK (Interaction Layer)
   *    - Handles message sending and UI interactions
   *    - Manages conversation flow and role switching
   *    - Integrates with analysis generation
   * 
   * Dependency Chain:
   * History → Analysis → Messages
   * - Messages hook receives generateAnalysis function from analysis hook
   * - Analysis hook receives setLegalAnalysis from history hook
   * - All hooks share the same clientId for data consistency
   */
  
  // STEP 1: Initialize data persistence and loading
  const {
    messages,              // Current conversation messages
    setMessages,           // Update messages state
    legalAnalysis,         // AI-generated legal analyses
    setLegalAnalysis,      // Update analyses state
    isLoadingHistory       // Initial data loading state
  } = useClientChatHistory(clientId);
  
  // STEP 2: Initialize AI analysis capabilities
  const {
    isAnalysisLoading,     // AI processing state
    analysisError,         // Analysis generation errors
    generateAnalysis       // Function to trigger AI analysis
  } = useClientChatAnalysis(clientId, setLegalAnalysis);
  
  // STEP 3: Initialize message handling and UI interactions
  const {
    isLoading,                      // Message sending state
    prefilledMessage,               // Pre-populated input text
    handleSendMessage,              // Send message function
    handleFollowUpQuestionClick,    // Handle AI follow-up questions
    formatTimestamp,                // Timestamp formatting utility
    activeTab,                      // Current speaker role
    setActiveTab,                   // Role switching function
    interviewMode,                  // Conversation mode
    setInterviewMode                // Mode switching function
  } = useClientChatMessages(clientId, messages, setMessages, generateAnalysis);

  // Auto-analysis disabled to prevent expensive API calls on every page load/refresh/navigation
  // Analysis will only run when user actively sends messages (via useClientChatMessages)
  // Uncomment below to re-enable auto-analysis:
  // const [autoTriggered, setAutoTriggered] = useState(false);
  // useEffect(() => {
  //   if (isLoadingHistory || autoTriggered) return;
  //   const hasFacts = messages.some(m => m.role === "facts" && m.content?.trim());
  //   const hasAnalysis = legalAnalysis.length > 0;
  //   if (hasFacts && !hasAnalysis) {
  //     setAutoTriggered(true);
  //     generateAnalysis(messages);
  //   }
  // }, [isLoadingHistory, autoTriggered, messages, legalAnalysis, generateAnalysis]);

  /**
   * MESSAGE HANDLER INTEGRATION
   * 
   * The messages hook expects both message content and active tab, but the UI
   * components only need to pass the message. This wrapper function integrates
   * the current activeTab state with the message content automatically.
   * 
   * This design keeps the component interface simple while maintaining the
   * flexibility of role-based message handling internally.
   */
  const handleSendMessageWithActiveTab = (message: string) => {
    return handleSendMessage(message, activeTab);
  };

  /**
   * UNIFIED HOOK INTERFACE
   * 
   * Returns a comprehensive interface that combines all chat functionality.
   * Components can import this single hook and access all necessary state
   * and functions without needing to know about the internal composition.
   * 
   * Organized by functional areas:
   * - Role Management: activeTab, setActiveTab, interviewMode, setInterviewMode
   * - Data: messages, legalAnalysis
   * - Loading States: isLoading, isAnalysisLoading, isLoadingHistory
   * - Error Handling: analysisError
   * - Interactions: handleSendMessage, handleFollowUpQuestionClick
   * - Utilities: formatTimestamp, prefilledMessage
   */
  return {
    // Role and mode management
    activeTab,                      // Current speaker: "attorney" | "client"
    setActiveTab,                   // Switch between attorney and client roles
    interviewMode,                  // Interview vs facts conversation mode
    setInterviewMode,               // Toggle conversation mode
    
    // Core data
    messages,                       // All conversation messages
    legalAnalysis,                  // AI-generated legal analyses
    
    // Loading and error states
    isLoading,                      // Message sending in progress
    isAnalysisLoading,              // AI analysis generation in progress
    isLoadingHistory,               // Initial data loading from database
    analysisError,                  // Analysis generation error message
    
    // User interactions
    handleSendMessage: handleSendMessageWithActiveTab,  // Send message with current role
    handleFollowUpQuestionClick,    // Handle AI follow-up question clicks
    
    // Utilities
    formatTimestamp,                // Current timestamp formatter
    prefilledMessage,               // Pre-populated input text
  };
};
