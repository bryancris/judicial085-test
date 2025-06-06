
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
  const [interviewMode, setInterviewMode] = useState(true);
  const { toast } = useToast();

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (message: string, currentActiveTab: "attorney" | "client") => {
    if (message.trim()) {
      setIsLoading(true);
      const timestamp = formatTimestamp();
      
      // Determine the role based on Interview Mode
      const messageRole = interviewMode ? currentActiveTab : "facts";
      
      const newMessage: ChatMessageProps = {
        content: message,
        timestamp,
        role: messageRole as "attorney" | "client"
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);
      
      // Save message to database
      const { success, error } = await saveMessage(clientId, message, messageRole, timestamp);
      
      if (!success) {
        toast({
          title: "Error Saving Message",
          description: error || "Failed to save message to database.",
          variant: "destructive",
        });
      }
      
      try {
        const updatedMessages = [...messages, newMessage];
        
        if (interviewMode) {
          // Interview Mode: Only generate analysis after client responds
          if (currentActiveTab === "client") {
            await generateAnalysis(updatedMessages);
            setActiveTab("attorney");
          } else {
            setActiveTab("client");
          }
        } else {
          // Facts Mode: Always generate analysis immediately
          await generateAnalysis(updatedMessages);
          // Don't change tabs in facts mode
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
    if (interviewMode) {
      setActiveTab("attorney");
    }
  };

  return {
    isLoading,
    prefilledMessage,
    setPrefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp,
    activeTab,
    setActiveTab,
    interviewMode,
    setInterviewMode
  };
};
