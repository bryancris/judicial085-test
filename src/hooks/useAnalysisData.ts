
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
      console.log("Raw analysis content:", analysis.content);
      console.log("Raw law references:", analysis.law_references);

      // Parse the analysis content
      const parsedData = parseAnalysisContent(analysis.content);
      
      // Helper function to safely convert Json to array with better logging
      const safeLawReferences = (lawRefs: Json | null): any[] => {
        console.log("Processing law references:", lawRefs);
        if (!lawRefs) {
          console.log("No law references found");
          return [];
        }
        if (Array.isArray(lawRefs)) {
          console.log(`Found ${lawRefs.length} law references`);
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
      console.log("Processed law references:", lawReferences);
      
      const completeAnalysisData: AnalysisData = {
        ...parsedData,
        timestamp: analysis.timestamp || analysis.created_at,
        lawReferences: lawReferences,
        caseType: analysis.case_type || extractCaseType(analysis.content)
      };

      console.log("Final analysis data with law references:", completeAnalysisData.lawReferences);
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

// Helper function to parse analysis content
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
  return "general";
};
