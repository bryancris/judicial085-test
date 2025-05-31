
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CaseAnalysisData } from "@/types/caseAnalysis";
import { 
  extractStrengthsWeaknesses, 
  calculatePredictionPercentages,
  extractAnalysisSections
} from "@/utils/analysisParsingUtils";
import { createConversationSummary } from "@/utils/conversationSummaryUtils";
import { useDocumentChange } from "@/contexts/DocumentChangeContext";

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
  lawReferences?: LawReference[];
  caseType?: string;
  remedies?: string;
  timestamp: string;
}

interface LawReference {
  id: string;
  title: string | null;
  url: string | null;
  content?: string | null;
}

export const useAnalysisData = (clientId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { documentChangeKey } = useDocumentChange();

  // Refresh analysis when documents change
  useEffect(() => {
    if (documentChangeKey > 0 && clientId) {
      console.log("Documents changed, refreshing analysis data...");
      fetchAnalysisData();
    }
  }, [documentChangeKey, clientId]);

  const fetchAnalysisData = async () => {
    try {
      setIsLoading(true);
      
      if (!clientId) {
        throw new Error("No client ID provided");
      }
      
      // Fetch client messages for conversation summary
      const { data: messages, error: messagesError } = await supabase
        .from("client_messages")
        .select("content, role, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;
      
      // Fetch the latest analysis
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from("legal_analyses")
        .select("content, created_at, timestamp")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingAnalysis && existingAnalysis.length > 0) {
        const latestAnalysis = existingAnalysis[0].content;
        const analysisTimestamp = existingAnalysis[0].timestamp || existingAnalysis[0].created_at;
        
        // Extract data from analysis content
        const strengthsAndWeaknesses = extractStrengthsWeaknesses(latestAnalysis);
        const predictionPercentages = calculatePredictionPercentages(latestAnalysis, strengthsAndWeaknesses);
        
        // Extract sections from the analysis
        const { relevantLaw, preliminaryAnalysis, potentialIssues, followUpQuestions } = 
          extractAnalysisSections(latestAnalysis);
        
        // Create the summarized conversation text
        const conversationSummary = createConversationSummary(messages);
        
        const parsedData: AnalysisData = {
          outcome: {
            defense: predictionPercentages.defense,
            prosecution: predictionPercentages.prosecution
          },
          legalAnalysis: {
            relevantLaw,
            preliminaryAnalysis,
            potentialIssues,
            followUpQuestions
          },
          strengths: strengthsAndWeaknesses.strengths,
          weaknesses: strengthsAndWeaknesses.weaknesses,
          conversationSummary,
          timestamp: typeof analysisTimestamp === 'string' ? 
            analysisTimestamp : 
            new Date(analysisTimestamp).toISOString()
        };
        
        setAnalysisData(parsedData);
        setError(null);
      } else {
        setAnalysisData(null);
        setError("No analysis data available for this client");
      }
    } catch (err: any) {
      console.error("Error fetching case analysis:", err);
      setError(err.message || "Failed to load case analysis");
      toast({
        title: "Error loading analysis",
        description: err.message || "There was a problem loading the case analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysisData,
    isLoading,
    error,
    fetchAnalysisData
  };
};
