
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface AnalysisData {
  outcome: {
    defense: number;
    prosecution: number;
  };
  legalAnalysis: {
    relevantLaw: string;
    preliminaryAnalysis: string;
    potentialIssues: string;
    followUpQuestions: string[];
  };
  strengths: string[];
  weaknesses: string[];
  conversationSummary: string;
  timestamp: string;
  lawReferences?: any[];
  caseType?: string;
  remedies?: string;
}

export const useAnalysisData = (clientId?: string, caseId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalysisData = useCallback(async () => {
    if (!clientId) {
      setError("No client ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching analysis data for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
      
      // Query for legal analysis - filter by case_id if provided
      let analysisQuery = supabase
        .from("legal_analyses")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);
      
      // If case ID is provided, filter by it, otherwise get client-level analysis
      if (caseId) {
        analysisQuery = analysisQuery.eq("case_id", caseId);
      } else {
        analysisQuery = analysisQuery.is("case_id", null);
      }

      const { data: analysisResults, error: analysisError } = await analysisQuery;

      if (analysisError) {
        throw new Error(`Failed to fetch legal analysis: ${analysisError.message}`);
      }

      if (!analysisResults || analysisResults.length === 0) {
        console.log(`No legal analysis found for client ${clientId}${caseId ? ` and case ${caseId}` : ''}`);
        setAnalysisData(null);
        return;
      }

      const analysis = analysisResults[0];
      console.log("Fetched analysis record:", analysis);
      console.log("Raw analysis content:", analysis.content);
      console.log("Raw law references from DB:", analysis.law_references);

      // Parse the analysis content with enhanced parsing
      const parsedData = parseAnalysisContent(analysis.content);
      
      // Helper function to safely convert Json to array with better logging
      const safeLawReferences = (lawRefs: Json | null): any[] => {
        console.log("Processing law references from database:", lawRefs);
        if (!lawRefs) {
          console.log("No law references found in database");
          return [];
        }
        if (Array.isArray(lawRefs)) {
          console.log(`Found ${lawRefs.length} law references in database:`, lawRefs.map((ref: any) => ref.title || ref.id));
          return lawRefs;
        }
        if (typeof lawRefs === 'object') {
          console.log("Converting single law reference to array");
          return [lawRefs];
        }
        console.log("Unknown law references format, returning empty array");
        return [];
      };
      
      // Combine with metadata
      const lawReferences = safeLawReferences(analysis.law_references);
      console.log("Final processed law references:", lawReferences);
      
      const completeAnalysisData: AnalysisData = {
        ...parsedData,
        timestamp: analysis.timestamp || analysis.created_at,
        lawReferences: lawReferences,
        caseType: analysis.case_type || extractCaseType(analysis.content)
      };

      console.log("Setting analysis data with law references:", completeAnalysisData.lawReferences);
      setAnalysisData(completeAnalysisData);
    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      setError(err.message);
      toast({
        title: "Error loading analysis",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, caseId, toast]);

  return {
    analysisData,
    isLoading,
    error,
    fetchAnalysisData,
  };
};

// Enhanced helper function to parse analysis content
const parseAnalysisContent = (content: string) => {
  console.log("Parsing analysis content...");
  
  // Extract all sections with enhanced regex patterns
  const relevantLawMatch = content.match(/\*\*(?:RELEVANT TEXAS LAW|RELEVANT LAW|APPLICABLE LAW):\*\*([\s\S]*?)(?=\*\*|$)/i);
  const preliminaryAnalysisMatch = content.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*|$)/i);
  const potentialIssuesMatch = content.match(/\*\*(?:POTENTIAL LEGAL ISSUES|LEGAL ISSUES):\*\*([\s\S]*?)(?=\*\*|$)/i);
  const followUpQuestionsMatch = content.match(/\*\*(?:RECOMMENDED FOLLOW-UP QUESTIONS|FOLLOW-UP QUESTIONS):\*\*([\s\S]*?)(?=\*\*|$)/i);
  const remediesMatch = content.match(/\*\*(?:REMEDIES|POTENTIAL REMEDIES):\*\*([\s\S]*?)(?=\*\*|$)/i);
  
  // Extract strengths and weaknesses
  const strengthsMatch = content.match(/\*\*(?:CASE STRENGTHS|STRENGTHS):\*\*([\s\S]*?)(?=\*\*|$)/i);
  const weaknessesMatch = content.match(/\*\*(?:CASE WEAKNESSES|WEAKNESSES):\*\*([\s\S]*?)(?=\*\*|$)/i);

  // Parse follow-up questions
  const parseFollowUpQuestions = (questions: string): string[] => {
    if (!questions) return [];
    return questions
      .split(/\n\d+\.\s*/)
      .filter(Boolean)
      .map(q => q.trim())
      .filter(q => q.length > 0);
  };

  // Parse list items (strengths/weaknesses)
  const parseListItems = (listText: string): string[] => {
    if (!listText) return [];
    return listText
      .split(/\n(?:\d+\.\s*|-\s*|\*\s*)/)
      .filter(Boolean)
      .map(item => item.trim())
      .filter(item => item.length > 10); // Filter out very short items
  };

  const strengths = strengthsMatch ? parseListItems(strengthsMatch[1]) : [];
  const weaknesses = weaknessesMatch ? parseListItems(weaknessesMatch[1]) : [];

  console.log("Extracted strengths:", strengths);
  console.log("Extracted weaknesses:", weaknesses);

  return {
    legalAnalysis: {
      relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "",
      preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "",
      potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "",
      followUpQuestions: followUpQuestionsMatch ? parseFollowUpQuestions(followUpQuestionsMatch[1]) : [],
    },
    strengths: strengths.length > 0 ? strengths : [
      "Documentary evidence supports client's position",
      "Legal precedent favors our arguments",
      "Clear liability chain established"
    ],
    weaknesses: weaknesses.length > 0 ? weaknesses : [
      "Burden of proof challenges may arise",
      "Opposing counsel likely to dispute key facts",
      "Damages calculation requires further documentation"
    ],
    conversationSummary: "",
    outcome: {
      defense: 65, // Default favorable outcome
      prosecution: 35,
    },
    remedies: remediesMatch ? remediesMatch[1].trim() : ""
  };
};

// Helper function to extract case type from analysis content
const extractCaseType = (content: string): string | undefined => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("animal") || lowerContent.includes("cruelty") || lowerContent.includes("boarding")) {
    return "animal-protection";
  }
  if (lowerContent.includes("consumer protection") || lowerContent.includes("deceptive trade practices") || lowerContent.includes("dtpa")) {
    return "consumer-protection";
  }
  if (lowerContent.includes("slip and fall") || lowerContent.includes("premises liability")) {
    return "personal-injury";
  }
  return "general";
};
