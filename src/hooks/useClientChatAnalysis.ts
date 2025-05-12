
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis, saveLegalAnalysis } from "@/utils/openaiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { AnalysisItem } from "./useClientChatHistory";

export const useClientChatAnalysis = (
  clientId: string,
  setLegalAnalysis: React.Dispatch<React.SetStateAction<AnalysisItem[]>>
) => {
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAnalysis = async (currentMessages: ChatMessageProps[]) => {
    // Only run analysis if we have at least one message from both attorney and client
    const hasAttorneyMessages = currentMessages.some(msg => msg.role === "attorney");
    const hasClientMessages = currentMessages.some(msg => msg.role === "client");
    
    if (!hasAttorneyMessages || !hasClientMessages) {
      return; // Don't generate analysis until we have both sides of the conversation
    }
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      // Send the conversation to generate legal analysis
      const { analysis, error, lawReferences } = await generateLegalAnalysis(clientId, currentMessages);
      
      if (error) {
        console.error("Error generating analysis:", error);
        setAnalysisError(error);
        toast({
          title: "Analysis Error",
          description: `Failed to generate legal analysis: ${error}`,
          variant: "destructive",
        });
      } else if (analysis) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add analysis to state
        const newAnalysis = {
          content: analysis,
          timestamp
        };
        
        setLegalAnalysis(prev => [...prev, newAnalysis]);
        
        // Save analysis to database
        const { success, error: saveError } = await saveLegalAnalysis(clientId, analysis, timestamp);
        
        if (!success) {
          toast({
            title: "Error Saving Analysis",
            description: saveError || "Failed to save analysis to database.",
            variant: "destructive",
          });
        }
      } else {
        setAnalysisError("No analysis was generated. Please try again.");
        toast({
          title: "Analysis Error",
          description: "No analysis content was returned. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error generating legal analysis:", err);
      setAnalysisError(err.message || "Unknown error");
      toast({
        title: "Analysis Error",
        description: "An unexpected error occurred while generating legal analysis.",
        variant: "destructive",
      });
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  return {
    isAnalysisLoading,
    analysisError,
    generateAnalysis
  };
};
