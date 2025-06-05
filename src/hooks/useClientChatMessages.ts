
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveMessage } from "@/utils/api/messageApiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export const useClientChatMessages = (
  clientId: string,
  messages: ChatMessageProps[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageProps[]>>,
  generateAnalysis: (updatedMessages: ChatMessageProps[]) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledMessage, setPrefilledMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"attorney" | "client">("attorney");
  const { toast } = useToast();

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (message: string, currentActiveTab: "attorney" | "client") => {
    if (message.trim()) {
      setIsLoading(true);
      const timestamp = formatTimestamp();
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: currentActiveTab
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);
      
      // Save message to database
      const { success, error } = await saveMessage(clientId, message, currentActiveTab, timestamp);
      
      if (!success) {
        toast({
          title: "Error Saving Message",
          description: error || "Failed to save message to database.",
          variant: "destructive",
        });
      }
      
      try {
        // Only generate legal analysis after client responds (not when attorney asks questions)
        const updatedMessages = [...messages, newMessage];
        
        // Check if this was a client message, and if so, generate an analysis
        if (currentActiveTab === "client") {
          await generateAnalysis(updatedMessages);
          
          // After client responds, switch back to attorney tab
          setActiveTab("attorney");
        } else {
          // After attorney sends message, switch to client tab
          setActiveTab("client");
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

  const handleFollowUpQuestionClick = (question: string) => {
    console.log("Follow-up question clicked in hook:", question);
    setPrefilledMessage(question);
    // When a follow-up question is clicked, we should switch to attorney tab
    setActiveTab("attorney");
  };

  return {
    isLoading,
    prefilledMessage,
    setPrefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp,
    activeTab,
    setActiveTab
  };
};
