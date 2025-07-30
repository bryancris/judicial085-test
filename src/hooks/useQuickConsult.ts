import { useState, useCallback } from "react";
import { QuickConsultMessage, QuickConsultResponse, sendQuickConsultMessage } from "@/utils/api/quickConsultService";
import { useToast } from "@/hooks/use-toast";

export const useQuickConsult = (clientId?: string) => {
  const [messages, setMessages] = useState<QuickConsultMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<QuickConsultResponse | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: QuickConsultMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentMessages = [...messages, userMessage];
      const response = await sendQuickConsultMessage(currentMessages, clientId);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      // Store the full response for potential citation display
      setLastResponse(response);

      const assistantMessage: QuickConsultMessage = {
        role: "assistant",
        content: response.text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show knowledge base usage toast
      if (response.hasKnowledgeBase && response.documentsFound && response.documentsFound > 0) {
        toast({
          title: "Knowledge Base Used",
          description: `Referenced ${response.documentsFound} document(s) from the knowledge base`,
          variant: "default",
        });
      }

      // Show verification status for CourtListener cases
      if (response.verifiedCases && response.verifiedCases > 0) {
        toast({
          title: "Cases Verified",
          description: `Verified ${response.verifiedCases} case citations with CourtListener for legal accuracy`,
          variant: "default",
        });
      }

      if (response.courtListenerCitations && response.courtListenerCitations > 0) {
        toast({
          title: "CourtListener Citations Added",
          description: `Added ${response.courtListenerCitations} verified citations with direct links`,
          variant: "default",
        });
      } else if (response.verifiedCases === 0) {
        toast({
          title: "⚠️ Citation Verification Needed",
          description: "CourtListener API requires setup for case verification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast, clientId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
  };
};