
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

  // Improved function to extract research updates from existing analysis
  const extractExistingResearchUpdates = (analysisContent: string): string[] => {
    const researchUpdates: string[] = [];
    
    // Look for research update patterns with more robust matching
    const researchUpdatePattern = /\*\*RESEARCH UPDATE[^*]*\*\*:?([\s\S]*?)(?=\n\s*\*\*[A-Z\s]+(?:UPDATE|ANALYSIS|CONCLUSION|SUMMARY)|$)/gi;
    
    let match;
    while ((match = researchUpdatePattern.exec(analysisContent)) !== null) {
      const fullUpdate = match[0].trim();
      if (fullUpdate && fullUpdate.length > 20) { // Only include substantial updates
        researchUpdates.push(fullUpdate);
        console.log("Extracted research update:", fullUpdate.substring(0, 100) + "...");
      }
    }

    // Fallback: Look for any content after "RESEARCH UPDATE" markers
    if (researchUpdates.length === 0) {
      const lines = analysisContent.split('\n');
      let currentUpdate = '';
      let inResearchUpdate = false;
      let updateStartIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('**RESEARCH UPDATE')) {
          // Start of a new research update
          if (currentUpdate.trim()) {
            researchUpdates.push(currentUpdate.trim());
          }
          currentUpdate = line;
          inResearchUpdate = true;
          updateStartIndex = i;
        } else if (inResearchUpdate) {
          // Check if we've reached the end of the update (next major section)
          if (line.match(/^\*\*[A-Z\s]+:?\*\*/) && !line.includes('RESEARCH UPDATE')) {
            // This is a new section, end the current update
            if (currentUpdate.trim()) {
              researchUpdates.push(currentUpdate.trim());
            }
            currentUpdate = '';
            inResearchUpdate = false;
          } else {
            // Continue building the current update
            currentUpdate += '\n' + line;
          }
        }
      }

      // Add the last update if it exists
      if (currentUpdate.trim()) {
        researchUpdates.push(currentUpdate.trim());
      }
    }

    console.log(`Found ${researchUpdates.length} research updates to preserve`);
    return researchUpdates;
  };

  const generateRealTimeAnalysis = async (fetchAnalysisData: () => Promise<void>) => {
    setIsGeneratingAnalysis(true);
    try {
      // Show loading toast
      toast({
        title: "Generating Analysis",
        description: "Real-time case analysis is being generated...",
      });

      // First, get any existing research updates that were manually added
      const { data: existingAnalysis } = await supabase
        .from("legal_analyses")
        .select("content")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      let existingResearchUpdates: string[] = [];
      if (existingAnalysis && existingAnalysis.length > 0) {
        existingResearchUpdates = extractExistingResearchUpdates(existingAnalysis[0].content);
        console.log("Found existing research updates:", existingResearchUpdates.length);
        
        // Log each update for debugging
        existingResearchUpdates.forEach((update, index) => {
          console.log(`Research Update ${index + 1}:`, update.substring(0, 200) + "...");
        });
      }

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
      
      // CRITICAL: After generating new analysis, append existing research updates
      if (existingResearchUpdates.length > 0) {
        const { data: newAnalysis } = await supabase
          .from("legal_analyses")
          .select("id, content")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (newAnalysis && newAnalysis.length > 0) {
          // Ensure proper formatting with clear separators
          const researchSection = existingResearchUpdates.join('\n\n');
          const updatedContent = newAnalysis[0].content + '\n\n' + researchSection;
          
          console.log("Preserving research updates in new analysis");
          console.log("Original content length:", newAnalysis[0].content.length);
          console.log("Research updates to add:", researchSection.length);
          
          await supabase
            .from("legal_analyses")
            .update({
              content: updatedContent,
              updated_at: new Date().toISOString()
            })
            .eq("id", newAnalysis[0].id);

          console.log("Successfully preserved", existingResearchUpdates.length, "research updates in new analysis");
        }
      }
      
      // CRITICAL: After generating new analysis, refresh from database
      await fetchAnalysisData();
      
      toast({
        title: "Analysis Generated",
        description: existingResearchUpdates.length > 0 
          ? `Analysis generated successfully and ${existingResearchUpdates.length} research update(s) preserved.`
          : "Real-time case analysis generated successfully.",
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
