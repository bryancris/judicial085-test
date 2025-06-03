
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

  // Enhanced function to extract and categorize research updates with better persistence
  const extractAndCategorizeResearchUpdates = (analysisContent: string): {
    updates: Array<{
      section: string;
      content: string;
      statutes: string[];
      topics: string[];
      timestamp: string;
      isIntegrated: boolean;
    }>;
    rawUpdates: string[];
  } => {
    const researchUpdates: string[] = [];
    const categorizedUpdates: Array<{
      section: string;
      content: string;
      statutes: string[];
      topics: string[];
      timestamp: string;
      isIntegrated: boolean;
    }> = [];
    
    // Enhanced pattern to capture research updates with timestamps
    const researchUpdatePattern = /\*\*RESEARCH UPDATE[^*]*\(([^)]+)\)\*\*:?([\s\S]*?)(?=\n\s*\*\*[A-Z\s]+(?:UPDATE|ANALYSIS|CONCLUSION|SUMMARY)|$)/gi;
    
    let match;
    while ((match = researchUpdatePattern.exec(analysisContent)) !== null) {
      const timestamp = match[1].trim();
      const fullUpdate = match[0].trim();
      
      if (fullUpdate && fullUpdate.length > 20) {
        researchUpdates.push(fullUpdate);
        
        // Extract statutes and legal topics from the update
        const statutes = extractStatutesFromText(fullUpdate);
        const topics = extractLegalTopicsFromText(fullUpdate);
        
        // Determine which section this update should enhance
        const targetSection = determineTargetSection(fullUpdate, statutes, topics);
        
        // Check if this update appears to be integrated into the main content
        const isIntegrated = checkIfUpdateIsIntegrated(analysisContent, fullUpdate, statutes);
        
        categorizedUpdates.push({
          section: targetSection,
          content: fullUpdate,
          statutes,
          topics,
          timestamp,
          isIntegrated
        });
        
        console.log("Categorized research update with integration status:", {
          section: targetSection,
          statutes,
          topics,
          timestamp,
          isIntegrated,
          preview: fullUpdate.substring(0, 100) + "..."
        });
      }
    }

    // Fallback: Look for any content after "RESEARCH UPDATE" markers
    if (researchUpdates.length === 0) {
      const lines = analysisContent.split('\n');
      let currentUpdate = '';
      let inResearchUpdate = false;
      let currentTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('**RESEARCH UPDATE')) {
          // Extract timestamp if present
          const timestampMatch = line.match(/\(([^)]+)\)/);
          if (timestampMatch) {
            currentTimestamp = timestampMatch[1];
          }
          
          if (currentUpdate.trim()) {
            researchUpdates.push(currentUpdate.trim());
            // Also categorize fallback updates
            const statutes = extractStatutesFromText(currentUpdate);
            const topics = extractLegalTopicsFromText(currentUpdate);
            const targetSection = determineTargetSection(currentUpdate, statutes, topics);
            const isIntegrated = checkIfUpdateIsIntegrated(analysisContent, currentUpdate, statutes);
            
            categorizedUpdates.push({
              section: targetSection,
              content: currentUpdate.trim(),
              statutes,
              topics,
              timestamp: currentTimestamp,
              isIntegrated
            });
          }
          currentUpdate = line;
          inResearchUpdate = true;
        } else if (inResearchUpdate) {
          if (line.match(/^\*\*[A-Z\s]+:?\*\*/) && !line.includes('RESEARCH UPDATE')) {
            if (currentUpdate.trim()) {
              researchUpdates.push(currentUpdate.trim());
              // Categorize this update too
              const statutes = extractStatutesFromText(currentUpdate);
              const topics = extractLegalTopicsFromText(currentUpdate);
              const targetSection = determineTargetSection(currentUpdate, statutes, topics);
              const isIntegrated = checkIfUpdateIsIntegrated(analysisContent, currentUpdate, statutes);
              
              categorizedUpdates.push({
                section: targetSection,
                content: currentUpdate.trim(),
                statutes,
                topics,
                timestamp: currentTimestamp,
                isIntegrated
              });
            }
            currentUpdate = '';
            inResearchUpdate = false;
          } else {
            currentUpdate += '\n' + line;
          }
        }
      }

      if (currentUpdate.trim()) {
        researchUpdates.push(currentUpdate.trim());
        const statutes = extractStatutesFromText(currentUpdate);
        const topics = extractLegalTopicsFromText(currentUpdate);
        const targetSection = determineTargetSection(currentUpdate, statutes, topics);
        const isIntegrated = checkIfUpdateIsIntegrated(analysisContent, currentUpdate, statutes);
        
        categorizedUpdates.push({
          section: targetSection,
          content: currentUpdate.trim(),
          statutes,
          topics,
          timestamp: currentTimestamp,
          isIntegrated
        });
      }
    }

    console.log(`Found ${researchUpdates.length} research updates, categorized into ${categorizedUpdates.length} sections`);
    return { updates: categorizedUpdates, rawUpdates: researchUpdates };
  };

  // New function to check if research update is integrated into main content
  const checkIfUpdateIsIntegrated = (analysisContent: string, updateContent: string, statutes: string[]): boolean => {
    // Check if key statutes from the update appear in the main analysis sections
    const mainSections = analysisContent.split('**RESEARCH UPDATE')[0]; // Only check content before research updates
    
    // Look for statute references in the main content
    for (const statute of statutes) {
      if (mainSections.includes(statute)) {
        return true;
      }
    }
    
    // Check for key phrases from the update in main sections
    const updateKeyPhrases = extractKeyPhrases(updateContent);
    for (const phrase of updateKeyPhrases) {
      if (mainSections.toLowerCase().includes(phrase.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  };

  // Helper function to extract key phrases from update content
  const extractKeyPhrases = (content: string): string[] => {
    const phrases: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Extract important legal concepts
    if (lowerContent.includes('dtpa')) phrases.push('DTPA');
    if (lowerContent.includes('deceptive trade practices')) phrases.push('deceptive trade practices');
    if (lowerContent.includes('treble damages')) phrases.push('treble damages');
    if (lowerContent.includes('economic damages')) phrases.push('economic damages');
    if (lowerContent.includes('mental anguish')) phrases.push('mental anguish');
    if (lowerContent.includes('attorney fees')) phrases.push('attorney fees');
    if (lowerContent.includes('pre-suit notice')) phrases.push('pre-suit notice');
    if (lowerContent.includes('knowing violations')) phrases.push('knowing violations');
    
    return phrases;
  };

  // Helper function to extract statutes from text
  const extractStatutesFromText = (text: string): string[] => {
    const statutes: string[] = [];
    
    // Pattern for Texas codes with section numbers
    const codePattern = /(Texas\s+[A-Za-z]+(?:\s+[&]?\s*[A-Za-z]+)*\s+Code\s+§\s+\d+\.\d+)/gi;
    const sectionPattern = /§\s+\d+\.\d+/gi;
    const dtpaPattern = /(DTPA|Texas\s+Deceptive\s+Trade\s+Practices\s+Act)/gi;
    
    let match;
    while ((match = codePattern.exec(text)) !== null) {
      statutes.push(match[1]);
    }
    while ((match = sectionPattern.exec(text)) !== null) {
      statutes.push(match[0]);
    }
    while ((match = dtpaPattern.exec(text)) !== null) {
      statutes.push(match[1]);
    }
    
    return [...new Set(statutes)];
  };

  // Helper function to extract legal topics from text
  const extractLegalTopicsFromText = (text: string): string[] => {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('deceptive trade') || lowerText.includes('dtpa') || lowerText.includes('consumer protection')) {
      topics.push('consumer-protection');
    }
    if (lowerText.includes('animal') || lowerText.includes('cruelty') || lowerText.includes('pet')) {
      topics.push('animal-protection');
    }
    if (lowerText.includes('contract') || lowerText.includes('breach')) {
      topics.push('contract');
    }
    if (lowerText.includes('negligence') || lowerText.includes('tort')) {
      topics.push('tort');
    }
    
    return topics;
  };

  // Helper function to determine which section the update should enhance
  const determineTargetSection = (updateText: string, statutes: string[], topics: string[]): string => {
    const lowerText = updateText.toLowerCase();
    
    // Check for specific legal areas
    if (lowerText.includes('dtpa') || lowerText.includes('deceptive trade') || statutes.some(s => s.includes('17.'))) {
      return 'RELEVANT TEXAS LAW - DTPA';
    }
    if (lowerText.includes('animal') || lowerText.includes('cruelty') || statutes.some(s => s.includes('42.09'))) {
      return 'RELEVANT TEXAS LAW - Animal Protection';
    }
    if (lowerText.includes('contract') || lowerText.includes('breach')) {
      return 'PRELIMINARY ANALYSIS - Contract Issues';
    }
    if (lowerText.includes('damages') || lowerText.includes('remedy')) {
      return 'POTENTIAL LEGAL ISSUES - Remedies';
    }
    
    // Default to relevant law section
    return 'RELEVANT TEXAS LAW';
  };

  const generateRealTimeAnalysis = async (fetchAnalysisData: () => Promise<void>) => {
    setIsGeneratingAnalysis(true);
    try {
      // Show loading toast
      toast({
        title: "Generating Analysis",
        description: "Preserving research updates and generating enhanced analysis...",
      });

      // First, get any existing research updates that were manually added and preserve them
      const { data: existingAnalysis } = await supabase
        .from("legal_analyses")
        .select("content")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      let preservedResearchUpdates: Array<{
        section: string;
        content: string;
        statutes: string[];
        topics: string[];
        timestamp: string;
        isIntegrated: boolean;
      }> = [];

      if (existingAnalysis && existingAnalysis.length > 0) {
        const { updates } = extractAndCategorizeResearchUpdates(existingAnalysis[0].content);
        preservedResearchUpdates = updates;
        
        console.log("Preserved existing research updates:", preservedResearchUpdates.length);
        console.log("Integration status:", preservedResearchUpdates.map(u => ({ 
          timestamp: u.timestamp, 
          isIntegrated: u.isIntegrated,
          statutes: u.statutes.slice(0, 2) // First 2 statutes for logging
        })));
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
      
      // Use the enhanced analysis generation system with preserved research updates
      await generateAnalysisWithResearchPreservation(formattedMessages, preservedResearchUpdates);
      
      // CRITICAL: After generating new analysis, refresh from database
      await fetchAnalysisData();
      
      const nonIntegratedCount = preservedResearchUpdates.filter(u => !u.isIntegrated).length;
      
      toast({
        title: "Analysis Generated with Preserved Updates",
        description: preservedResearchUpdates.length > 0 
          ? `Analysis generated successfully with ${preservedResearchUpdates.length} research update(s) preserved. ${nonIntegratedCount > 0 ? `${nonIntegratedCount} update(s) kept as separate sections.` : 'All updates integrated into main sections.'}`
          : "Enhanced analysis generated successfully.",
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

  // Enhanced function to generate analysis with research preservation
  const generateAnalysisWithResearchPreservation = async (
    formattedMessages: any[],
    preservedResearchUpdates: Array<{
      section: string;
      content: string;
      statutes: string[];
      topics: string[];
      timestamp: string;
      isIntegrated: boolean;
    }>
  ) => {
    try {
      console.log("Generating analysis with research preservation:", {
        messagesCount: formattedMessages.length,
        preservedUpdatesCount: preservedResearchUpdates.length
      });

      // Call the enhanced edge function with preserved research updates
      const { data, error } = await supabase.functions.invoke('generate-legal-analysis', {
        body: {
          clientId,
          conversation: formattedMessages,
          caseId,
          researchUpdates: preservedResearchUpdates // Pass the preserved research updates
        }
      });

      if (error) {
        console.error("Error calling generate-legal-analysis:", error);
        throw new Error(error.message || "Failed to generate analysis");
      }

      const { analysis, lawReferences, documentsUsed, caseType } = data;

      if (!analysis) {
        throw new Error("No analysis content received from the service");
      }

      console.log("Analysis generated successfully with research preservation");

      // Check if preserved research updates were properly integrated
      let finalAnalysisContent = analysis;
      const nonIntegratedUpdates = preservedResearchUpdates.filter(update => 
        !checkIfUpdateIsIntegrated(analysis, update.content, update.statutes)
      );

      // If some updates weren't integrated, append them to preserve the information
      if (nonIntegratedUpdates.length > 0) {
        console.log(`Appending ${nonIntegratedUpdates.length} non-integrated research updates`);
        finalAnalysisContent += "\n\n**PRESERVED RESEARCH UPDATES:**\n\n";
        nonIntegratedUpdates.forEach(update => {
          finalAnalysisContent += `${update.content}\n\n`;
        });
      }

      // Save the enhanced analysis with preserved research updates
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const { data: existingAnalyses } = await supabase
        .from('legal_analyses')
        .select('id')
        .eq('client_id', clientId);
        
      if (existingAnalyses && existingAnalyses.length > 0) {
        const { error: updateError } = await supabase
          .from('legal_analyses')
          .update({ 
            content: finalAnalysisContent,
            timestamp,
            updated_at: new Date().toISOString(),
            law_references: lawReferences ? JSON.stringify(lawReferences) : null,
            case_type: caseType || 'general'
          })
          .eq('client_id', clientId);
          
        if (updateError) {
          console.error("Error updating legal analysis:", updateError);
          throw new Error(updateError.message);
        }
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error: insertError } = await supabase
          .from('legal_analyses')
          .insert({
            client_id: clientId,
            content: finalAnalysisContent,
            timestamp,
            law_references: lawReferences ? JSON.stringify(lawReferences) : null,
            case_type: caseType || 'general',
            user_id: userData.user?.id || 'anonymous'
          });
          
        if (insertError) {
          console.error("Error inserting legal analysis:", insertError);
          throw new Error(insertError.message);
        }
      }

    } catch (error: any) {
      console.error("Error in generateAnalysisWithResearchPreservation:", error);
      throw error;
    }
  };

  return {
    isGeneratingAnalysis,
    generateRealTimeAnalysis
  };
};
