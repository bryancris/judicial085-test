
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientChatAnalysis } from "@/hooks/useClientChatAnalysis";

export const useAnalysisGeneration = (clientId: string, caseId?: string) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const { toast } = useToast();
  
  // Dummy state setter for hook compatibility
  const [, setLegalAnalysis] = useState<any[]>([]);
  const { generateAnalysis } = useClientChatAnalysis(clientId, setLegalAnalysis);

  const generateRealTimeAnalysis = async (fetchAnalysisData: () => Promise<void>) => {
    setIsGeneratingAnalysis(true);
    try {
      // Show loading toast
      toast({
        title: "Generating Analysis",
        description: "Real-time case analysis is being generated...",
      });

      // Fetch the client messages for this client
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      // Check if we have a conversation or should use documents
      const hasConversation = messages && messages.length > 0;
      
      if (!hasConversation) {
        // Check for documents marked for analysis
        const documentsQuery = supabase
          .from("document_metadata")
          .select("id, title, include_in_analysis")
          .eq("client_id", clientId)
          .eq("include_in_analysis", true);
        
        // If we have a specific case, filter by case_id, otherwise get all client documents
        if (caseId) {
          documentsQuery.eq("case_id", caseId);
        }
        
        const { data: documents, error: documentsError } = await documentsQuery;
        
        if (documentsError) throw documentsError;
        
        if (!documents || documents.length === 0) {
          throw new Error("No client conversation or documents marked for analysis found. Please either start a conversation with the client or upload documents and mark them for inclusion in analysis.");
        }
      }
      
      // Format messages for the analysis (empty array if no conversation)
      const formattedMessages = hasConversation ? messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      })) : [];
      
      // Use the analysis generation system with document-only capability
      await generateAnalysis(formattedMessages, true);
      
      // CRITICAL: After generating new analysis, refresh from database
      await fetchAnalysisData();
      
      toast({
        title: "Analysis Generated",
        description: "Real-time case analysis generated successfully.",
      });
    } catch (err: any) {
      console.error("Error generating real-time analysis:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate real-time analysis.",
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
