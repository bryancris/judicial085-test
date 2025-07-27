
/**
 * CLIENT CHAT HISTORY HOOK
 * 
 * This hook manages the data persistence layer for the client intake system.
 * It handles loading and managing both conversation messages and legal analyses from the database.
 * 
 * Key Responsibilities:
 * 1. Data Loading - Fetches existing messages and analyses on mount
 * 2. State Management - Provides state and setters for other hooks
 * 3. Error Handling - Shows user-friendly error messages for data issues
 * 4. Loading States - Manages UI loading states during data fetching
 * 
 * Data Sources:
 * - client_messages table: Conversation messages with roles and timestamps
 * - legal_analyses table: AI-generated legal analyses with timestamps
 * 
 * Integration:
 * - Provides state setters to other hooks for real-time updates
 * - Used by useClientChat as the data foundation layer
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getClientMessages } from "@/utils/api/messageApiService";
import { getClientLegalAnalyses } from "@/utils/api/legalContentApiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

/**
 * ANALYSIS ITEM INTERFACE
 * 
 * Defines the structure for legal analysis items displayed in the UI.
 * This interface standardizes how AI-generated analyses are handled across the system.
 * 
 * @param content - The main analysis text (markdown formatted)
 * @param timestamp - When the analysis was generated (for display)
 * @param documentsUsed - Optional array of documents that informed the analysis
 */
export interface AnalysisItem {
  content: string;        // AI-generated legal analysis content (markdown)
  timestamp: string;      // Generation timestamp for display
  documentsUsed?: any[];  // Documents that informed this analysis (optional)
}

/**
 * Hook Parameter:
 * @param clientId - Unique client identifier for data filtering
 */
export const useClientChatHistory = (clientId: string) => {
  /**
   * STATE MANAGEMENT
   * 
   * Core state for conversation data:
   * - messages: All conversation messages (attorney, client, facts)
   * - legalAnalysis: AI-generated legal analyses
   * - isLoadingHistory: Loading state for initial data fetch
   */
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);     // Conversation messages
  const [legalAnalysis, setLegalAnalysis] = useState<AnalysisItem[]>([]); // AI analyses
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);       // Loading state
  const { toast } = useToast();

  /**
   * DATA LOADING EFFECT
   * 
   * Loads both conversation messages and legal analyses when component mounts
   * or when clientId changes. This ensures the UI always shows the latest data.
   * 
   * Loading Strategy:
   * 1. Set loading state to true
   * 2. Load messages and analyses in parallel (for better performance)
   * 3. Handle each data source error independently (partial failure handling)
   * 4. Always clear loading state when done
   * 
   * Error Handling:
   * - Individual errors for messages vs analyses (user knows what failed)
   * - Non-blocking errors (if one fails, the other can still load)
   * - User-friendly error messages via toast notifications
   */
  useEffect(() => {
    const loadChatHistory = async () => {
      setIsLoadingHistory(true);
      try {
        /**
         * PARALLEL DATA LOADING
         * 
         * Load messages and analyses concurrently for better performance.
         * Each has independent error handling to allow partial success.
         */
        
        // Load conversation messages
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
        /**
         * CATASTROPHIC ERROR HANDLING
         * 
         * Catch-all for unexpected errors (network issues, etc.)
         */
        console.error("Error loading chat history:", err);
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        });
      } finally {
        /**
         * LOADING STATE CLEANUP
         * 
         * Always clear loading state, regardless of success/failure.
         * This ensures UI doesn't get stuck in loading state.
         */
        setIsLoadingHistory(false);
      }
    };

    /**
     * CONDITIONAL LOADING
     * 
     * Only load data if clientId is provided.
     * This prevents unnecessary API calls with undefined clientId.
     */
    if (clientId) {
      loadChatHistory();
    }
  }, [clientId, toast]); // Re-run when clientId changes

  /**
   * HOOK INTERFACE
   * 
   * Returns data and state management functions for use by other hooks and components.
   * The setters are used by other hooks to update state in real-time as new messages
   * and analyses are created.
   */
  return {
    // Data state
    messages,               // Current conversation messages
    legalAnalysis,          // Current AI-generated analyses
    
    // State setters (for other hooks to update state)
    setMessages,            // Update messages (used by message hook)
    setLegalAnalysis,       // Update analyses (used by analysis hook)
    
    // Loading state
    isLoadingHistory        // Initial data loading state
  };
};
