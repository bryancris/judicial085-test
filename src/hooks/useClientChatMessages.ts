
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveMessage } from "@/utils/openaiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export const useClientChatMessages = (
  clientId: string,
  messages: ChatMessageProps[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageProps[]>>,
  generateAnalysis: (updatedMessages: ChatMessageProps[]) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledMessage, setPrefilledMessage] = useState("");
  const { toast } = useToast();

  const formatTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (message: string, activeTab: "attorney" | "client") => {
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
        // Only generate legal analysis after client responds (not when attorney asks questions)
        const updatedMessages = [...messages, newMessage];
        
        // Check if this was a client message, and if so, generate an analysis
        if (activeTab === "client") {
          await generateAnalysis(updatedMessages);
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
  };

  return {
    isLoading,
    prefilledMessage,
    setPrefilledMessage,
    handleSendMessage,
    handleFollowUpQuestionClick,
    formatTimestamp
  };
};
