
/**
 * CLIENT CHAT MESSAGES HOOK
 * 
 * This hook manages all message-related operations and UI interactions for the client intake chat.
 * It handles the core conversation flow, role switching, and integration with AI analysis generation.
 * 
 * Key Responsibilities:
 * 1. Message Sending - Handles user input, validation, and persistence
 * 2. Role Management - Switches between attorney and client roles
 * 3. Conversation Flow - Manages interview vs facts mode behavior
 * 4. AI Integration - Triggers analysis generation based on conversation flow
 * 5. UI State - Manages loading states, prefilled messages, and timestamps
 * 
 * Conversation Modes:
 * - Interview Mode: Structured Q&A with automatic role switching
 * - Facts Mode: Open discussion with continuous analysis generation
 * 
 * Role Switching Logic:
 * - Interview Mode: Attorney asks → Client responds → AI analyzes → repeat
 * - Facts Mode: Any role can speak, immediate AI analysis after each message
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveMessage } from "@/utils/api/messageApiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

/**
 * Hook Parameters:
 * @param clientId - Unique client identifier for data persistence
 * @param messages - Current conversation messages (from history hook)
 * @param setMessages - State setter for updating messages (from history hook)
 * @param generateAnalysis - AI analysis function (from analysis hook)
 */
export const useClientChatMessages = (
  clientId: string,
  messages: ChatMessageProps[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageProps[]>>,
  generateAnalysis: (updatedMessages: ChatMessageProps[]) => Promise<void>
) => {
  /**
   * HOOK STATE MANAGEMENT
   * 
   * Local state for message operations and UI interactions:
   * - isLoading: Prevents multiple message sends, shows loading UI
   * - prefilledMessage: Text from AI follow-up questions
   * - activeTab: Current speaker role (attorney/client)
   * - interviewMode: Conversation flow mode (interview/facts)
   */
  const [isLoading, setIsLoading] = useState(false);              // Message sending state
  const [prefilledMessage, setPrefilledMessage] = useState("");   // Pre-populated input text
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney"); // Current speaker
  const [interviewMode, setInterviewMode] = useState(true);       // Conversation mode
  const { toast } = useToast();

  /**
   * TIMESTAMP UTILITY
   * 
   * Generates formatted timestamps for messages.
   * Returns time in HH:MM format for consistent display across the chat.
   */
  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * MESSAGE SENDING HANDLER
   * 
   * Core function that handles the complete message sending flow:
   * 1. Message validation and role assignment
   * 2. UI state updates (optimistic updates)
   * 3. Database persistence
   * 4. AI analysis triggering based on conversation mode
   * 5. Role switching logic
   * 
   * Interview Mode Flow:
   * - Attorney sends question → Switch to client role
   * - Client responds → Generate AI analysis → Switch back to attorney
   * 
   * Facts Mode Flow:
   * - Any role sends message → Generate AI analysis immediately
   * - No automatic role switching
   * 
   * Error Handling:
   * - Database save errors are logged but don't block the conversation
   * - AI analysis errors are caught and displayed to user
   * - Loading state is always cleared in finally block
   */
  const handleSendMessage = async (message: string, currentActiveTab: "attorney" | "client") => {
    if (message.trim()) {
      setIsLoading(true);
      const timestamp = formatTimestamp();
      
      /**
       * ROLE ASSIGNMENT LOGIC
       * 
       * Interview Mode: Use the current active tab (attorney/client)
       * Facts Mode: Always use "facts" role for all messages
       */
      const messageRole = interviewMode ? currentActiveTab : "facts";
      
      // Create message object
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: messageRole
      };

      /**
       * OPTIMISTIC UI UPDATE
       * 
       * Add message to UI immediately for better UX.
       * If database save fails, the message stays in UI but error is shown.
       */
      setMessages(prev => [...prev, newMessage]);
      
      /**
       * DATABASE PERSISTENCE
       * 
       * Save message to Supabase. Errors are shown but don't block conversation.
       * This allows users to continue chatting even if there are temporary DB issues.
       */
      const { success, error } = await saveMessage(clientId, message, messageRole, timestamp);
      
      if (!success) {
        toast({
          title: "Error Saving Message",
          description: error || "Failed to save message to database.",
          variant: "destructive",
        });
      }
      
      try {
        /**
         * AI ANALYSIS AND ROLE SWITCHING
         * 
         * The behavior differs based on conversation mode:
         */
        const updatedMessages = [...messages, newMessage];
        
        if (interviewMode) {
          /**
           * INTERVIEW MODE LOGIC
           * 
           * Structured Q&A flow:
           * - Attorney asks question → Switch to client tab (no analysis yet)
           * - Client responds → Generate analysis → Switch back to attorney
           * 
           * This creates a natural interview rhythm where analysis happens
           * after each complete Q&A exchange.
           */
          if (currentActiveTab === "client") {
            await generateAnalysis(updatedMessages);
            setActiveTab("attorney"); // Attorney asks next question
          } else {
            setActiveTab("client");   // Wait for client response
          }
        } else {
          /**
           * FACTS MODE LOGIC
           * 
           * Open discussion flow:
           * - Any message triggers immediate AI analysis
           * - No automatic role switching (user controls roles manually)
           * 
           * This allows for more flexible conversation where either party
           * can contribute facts and get immediate AI insights.
           */
          await generateAnalysis(updatedMessages);
          // Don't change tabs - user controls the flow
        }
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

  /**
   * FOLLOW-UP QUESTION HANDLER
   * 
   * When users click on AI-generated follow-up questions:
   * 1. Pre-populate the input field with the question text
   * 2. Switch to attorney tab (questions typically come from attorney)
   * 
   * This creates a smooth UX where users can quickly ask AI-suggested questions
   * without manually typing them or switching roles.
   */
  const handleFollowUpQuestionClick = (question: string) => {
    console.log("Follow-up question clicked in hook:", question);
    setPrefilledMessage(question);
    // Follow-up questions are typically attorney questions
    if (interviewMode) {
      setActiveTab("attorney");
    }
  };

  /**
   * HOOK INTERFACE
   * 
   * Returns all message-related state and functions for use by components.
   * Organized by functional area for clarity.
   */
  return {
    // Loading and UI state
    isLoading,                      // Message sending in progress
    prefilledMessage,               // Pre-populated input text from follow-up questions
    setPrefilledMessage,            // Clear/set prefilled text (used by input component)
    
    // Core interactions
    handleSendMessage,              // Send new message with role and analysis logic
    handleFollowUpQuestionClick,    // Handle AI follow-up question clicks
    
    // Utilities
    formatTimestamp,                // Current timestamp formatter
    
    // Role and mode management
    activeTab,                      // Current speaker role
    setActiveTab,                   // Manual role switching
    interviewMode,                  // Conversation mode
    setInterviewMode                // Toggle between interview and facts mode
  };
};
