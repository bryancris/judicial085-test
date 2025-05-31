
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis, saveLegalAnalysis } from "@/utils/openaiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { AnalysisItem } from "./useClientChatHistory";
import { useDocumentChange } from "@/contexts/DocumentChangeContext";

export const useClientChatAnalysis = (
  clientId: string,
  setLegalAnalysis: React.Dispatch<React.SetStateAction<AnalysisItem[]>>
) => {
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [documentsUsed, setDocumentsUsed] = useState<any[]>([]);
  const [lastMessages, setLastMessages] = useState<ChatMessageProps[]>([]);
  const { toast } = useToast();
  const { documentChangeKey } = useDocumentChange();

  // Re-run analysis when documents change and we have messages
  useEffect(() => {
    if (documentChangeKey > 0 && lastMessages.length > 0) {
      console.log("Documents changed, re-running analysis with new documents...");
      generateAnalysis(lastMessages);
    }
  }, [documentChangeKey]);

  const generateAnalysis = async (currentMessages: ChatMessageProps[]) => {
    // Store messages for potential re-analysis
    setLastMessages(currentMessages);
    
    // Only run analysis if we have at least one message from both attorney and client
    const hasAttorneyMessages = currentMessages.some(msg => msg.role === "attorney");
    const hasClientMessages = currentMessages.some(msg => msg.role === "client");
    
    if (!hasAttorneyMessages || !hasClientMessages) {
      return; // Don't generate analysis until we have both sides of the conversation
    }
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    setDocumentsUsed([]);
    
    try {
      // Send the conversation to generate legal analysis
      const { analysis, error, lawReferences, documentsUsed: docsUsed } = await generateLegalAnalysis(clientId, currentMessages);
      
      // Update state with documents used in the analysis
      if (docsUsed && docsUsed.length > 0) {
        setDocumentsUsed(docsUsed);
        console.log("Documents used in analysis:", docsUsed);
        
        // Notify user that documents were used in analysis
        toast({
          title: "Documents Used in Analysis",
          description: `${docsUsed.length} client document${docsUsed.length > 1 ? 's were' : ' was'} used in generating this analysis.`,
        });
      }
      
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
          timestamp,
          documentsUsed: docsUsed || []
        };
        
        setLegalAnalysis(prev => [...prev, newAnalysis]);
        
        // Save analysis to database
        const { success, error: saveError } = await saveLegalAnalysis(clientId, analysis, timestamp, docsUsed);
        
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
    documentsUsed,
    generateAnalysis
  };
};
