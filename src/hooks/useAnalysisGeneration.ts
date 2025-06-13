
import { useState } from "react";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { useToast } from "@/hooks/use-toast";
import { ChatMessageProps } from "@/components/clients/chat/ChatMessage";

export const useAnalysisGeneration = (clientId?: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const { toast } = useToast();

  const generateRealTimeAnalysis = async (
    onAnalysisComplete?: () => Promise<void>,
    onSimilarCasesComplete?: () => void,
    onScholarlyReferencesComplete?: () => void
  ) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required for analysis generation",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAnalysis(true);

    try {
      console.log("Starting real-time analysis generation for client:", clientId, "case:", caseId);
      
      // Get messages from the database instead of using chat hook
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Build query for messages - if caseId is provided, filter by it
      let messageQuery = supabase
        .from("client_messages")
        .select("*")
        .eq("client_id", clientId);

      // Apply case filtering if caseId is provided
      if (caseId) {
        messageQuery = messageQuery.eq("case_id", caseId);
      } else {
        messageQuery = messageQuery.is("case_id", null);
      }

      const { data: dbMessages } = await messageQuery
        .order("created_at", { ascending: true });

      // Transform database messages to ChatMessageProps format
      const messages: ChatMessageProps[] = (dbMessages || []).map(msg => ({
        content: msg.content,
        timestamp: msg.timestamp,
        role: msg.role as "attorney" | "client"
      }));

      console.log("Found messages for analysis:", messages.length, "for case:", caseId || "client-level");

      const result = await generateLegalAnalysis(clientId, messages, caseId);
      
      if (result.error) {
        console.error("Analysis generation failed:", result.error);
        toast({
          title: "Analysis Generation Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Analysis generation completed successfully");
      
      // Show success message
      toast({
        title: "Analysis Complete",
        description: `Legal analysis has been generated successfully${caseId ? ' for this case' : ''}.`,
      });

      // Refresh analysis data first
      if (onAnalysisComplete) {
        console.log("Refreshing analysis data...");
        await onAnalysisComplete();
        console.log("✅ Analysis data refreshed");
      }

      // Auto-trigger similar cases search after analysis is complete
      if (onSimilarCasesComplete) {
        console.log("🔍 Auto-triggering similar cases search...");
        // Small delay to ensure analysis data is properly loaded
        setTimeout(() => {
          onSimilarCasesComplete();
        }, 1000);
      }

      // Auto-trigger scholarly references search after analysis is complete
      if (onScholarlyReferencesComplete) {
        console.log("📚 Auto-triggering scholarly references search...");
        // Small delay to ensure analysis data is properly loaded
        setTimeout(() => {
          onScholarlyReferencesComplete();
        }, 1500);
      }

    } catch (error: any) {
      console.error("Unexpected error during analysis generation:", error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred during analysis generation: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  return {
    isGeneratingAnalysis,
    generateRealTimeAnalysis
  };
};
