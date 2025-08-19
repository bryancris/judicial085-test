import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateLegalAnalysis } from "@/utils/api/analysisApiService";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";

export const useRealTimeAnalysis = (clientId?: string, caseId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    if (!clientId) {
      setError("No client ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Generating real-time analysis for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
      
      // Fetch the client messages for this client
      const messagesQuery = supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId);

      if (caseId) {
        messagesQuery.eq("case_id", caseId);
      } else {
        messagesQuery.is("case_id", null);
      }

      const { data: messages, error: messagesError } = await messagesQuery
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
        
        console.log(`Found ${documents.length} documents marked for analysis`);
      }
      
      // Format messages for the analysis (empty array if no conversation)
      const formattedMessages = hasConversation ? messages.map(msg => ({
        content: msg.content,
        role: msg.role as "attorney" | "client",
        timestamp: msg.timestamp
      })) : [];
      
      console.log("Generating fresh real-time analysis...");

      // Pass requestContext to indicate this is case analysis
      const requestContext = caseId ? 'case-analysis' : 'client-analysis';

      // Call the edge function to generate a new analysis - fix the function call
      const { analysis, lawReferences, error: analysisError } = await generateLegalAnalysis(
        clientId, 
        formattedMessages,
        caseId,
        requestContext
      );
      
      if (analysisError) throw new Error(analysisError);
      
      if (analysis && lawReferences) {
        // Parse the analysis content
        const parsedData = parseAnalysisContent(analysis);
        
        // Create complete analysis data with law references
        const completeAnalysisData: AnalysisData = {
          ...parsedData,
          timestamp: new Date().toISOString(),
          lawReferences: lawReferences, // Use the fresh law references from the API
          caseType: extractCaseType(analysis)
        };

        console.log("Setting real-time analysis data with law references:", completeAnalysisData.lawReferences);
        setAnalysisData(completeAnalysisData);
        
        const analysisType = hasConversation ? "conversation" : "documents";
        
        toast({
          title: "Analysis Generated",
          description: `Real-time case analysis generated from ${analysisType} with ${lawReferences?.length || 0} law references.`,
        });
      } else {
        throw new Error("Failed to generate analysis content or law references");
      }
    } catch (err: any) {
      console.error("Error generating real-time analysis:", err);
      setError(err.message || "Failed to generate analysis");
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate real-time analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate analysis on mount
  useEffect(() => {
    if (clientId) {
      generateAnalysis();
    }
  }, [clientId, caseId]);

  return {
    analysisData,
    isLoading,
    error,
    generateAnalysis
  };
};

// Helper function to parse analysis content (same as in useAnalysisData)
const parseAnalysisContent = (content: string) => {
  const sections = content.split(/(\*\*.*?:\*\*)/).filter(Boolean);
  
  const data: any = {};
  let currentSection = null;

  for (const section of sections) {
    if (section.startsWith("**") && section.endsWith("**")) {
      currentSection = section.slice(2, -2).replace(/:$/, '').trim();
      data[currentSection] = "";
    } else if (currentSection) {
      data[currentSection] = section.trim();
      currentSection = null;
    }
  }

  const parseFollowUpQuestions = (questions: string): string[] => {
    const questionList = questions.split(/\n\d+\.\s/).filter(Boolean);
    return questionList.map(q => q.trim());
  };

  return {
    legalAnalysis: {
      relevantLaw: data["RELEVANT TEXAS LAW"] || "",
      preliminaryAnalysis: data["PRELIMINARY ANALYSIS"] || "",
      potentialIssues: data["POTENTIAL LEGAL ISSUES"] || "",
      followUpQuestions: parseFollowUpQuestions(data["RECOMMENDED FOLLOW-UP QUESTIONS"] || []),
    },
    strengths: [],
    weaknesses: [],
    conversationSummary: "",
    outcome: {
      defense: 0.5,
      prosecution: 0.5,
    },
    remedies: data["REMEDIES"] || ""
  };
};

// Helper function to extract case type from analysis content
const extractCaseType = (content: string): string | undefined => {
  if (content.includes("Consumer Protection") || content.includes("Deceptive Trade Practices")) {
    return "consumer-protection";
  }
  if (content.includes("Animal") || content.includes("Cruelty") || content.includes("Penal Code")) {
    return "animal-protection";
  }
  return "general";
};
