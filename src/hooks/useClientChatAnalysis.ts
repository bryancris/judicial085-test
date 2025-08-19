

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { saveLegalAnalysis } from "@/utils/api/legalContentApiService";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";
import { AnalysisItem } from "./useClientChatHistory";

export const useClientChatAnalysis = (
  clientId: string,
  setLegalAnalysis: React.Dispatch<React.SetStateAction<AnalysisItem[]>>
) => {
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [documentsUsed, setDocumentsUsed] = useState<any[]>([]);
  const { toast } = useToast();

  const generateAnalysis = async (currentMessages: ChatMessageProps[], allowDocumentOnly = false) => {
    // Check if we have conversation messages
    const hasAttorneyMessages = currentMessages.some(msg => msg.role === "attorney");
    const hasClientMessages = currentMessages.some(msg => msg.role === "client");
    const hasFactsMessages = currentMessages.some(msg => msg.role === "facts");
    const hasConversation = hasAttorneyMessages && hasClientMessages;
    const hasFactsInput = hasFactsMessages;
    
    console.log("Analysis trigger check:", {
      hasAttorneyMessages,
      hasClientMessages, 
      hasFactsMessages,
      hasConversation,
      hasFactsInput,
      allowDocumentOnly,
      messageCount: currentMessages.length
    });
    
    // Allow analysis if we have facts input, full conversation, or document-only is allowed
    if (!hasFactsInput && !hasConversation && !allowDocumentOnly) {
      console.log("Skipping analysis - no facts, conversation, or document-only flag");
      return; // Don't generate analysis until we have conversation or facts
    }
    
    // If we allow document-only analysis but have no conversation, we'll proceed with empty messages
    // The backend will use client documents for analysis instead
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    setDocumentsUsed([]);
    
    try {
      // Send the conversation to generate legal analysis (can be empty for document-only analysis)
      const { analysis, error, lawReferences, documentsUsed: docsUsed } = await generateLegalAnalysis(clientId, currentMessages, undefined, 'client-intake');
      
      // Update state with documents used in the analysis
      if (docsUsed && docsUsed.length > 0) {
        setDocumentsUsed(docsUsed);
        console.log("Documents used in analysis:", docsUsed);
        
        // Notify user that documents were used in analysis
        const analysisType = hasConversation ? "conversation and documents" : hasFactsInput ? "facts and documents" : "documents";
        toast({
          title: "Documents Used in Analysis",
          description: `${docsUsed.length} client document${docsUsed.length > 1 ? 's were' : ' was'} used in generating this analysis from ${analysisType}.`,
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
        
        // Add analysis to state with proper law references
        const newAnalysis = {
          content: analysis,
          timestamp,
          documentsUsed: docsUsed || [],
          lawReferences: lawReferences || [] // Store the actual law references from the backend
        };
        
        setLegalAnalysis(prev => [...prev, newAnalysis]);
        
        // Save analysis to database - fix the function call to use correct number of arguments
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
    documentsUsed,
    generateAnalysis
  };
};

