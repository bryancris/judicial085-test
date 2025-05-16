
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisGeneration } from "./useAnalysisGeneration";
import { LawReference } from "@/types/caseAnalysis";
import { extractAnalysisSections, extractStrengthsWeaknesses, calculatePredictionPercentages, detectCaseType } from "@/utils/analysisParsingUtils";

interface AnalysisData {
  outcome: {
    defense: string;
    prosecution: string;
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
}

export const useCaseAnalysis = (clientId: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { generateNewAnalysis, isGenerating } = useAnalysisGeneration(clientId, fetchAnalysisData);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchAnalysisData();
    }
  }, [clientId]);

  async function fetchAnalysisData() {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("legal_analyses")
        .select("content, law_references")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const analysis = data[0];
        const content = analysis.content;
        
        // Transform the law_references JSON to match the LawReference type
        let lawReferences: LawReference[] = [];
        
        if (analysis.law_references) {
          try {
            // Cast the JSON array to our LawReference type
            lawReferences = (analysis.law_references as any[]).map(ref => ({
              id: ref.id || "",
              title: ref.title || null,
              url: ref.url || null,
              content: ref.content || null
            }));
          } catch (err) {
            console.error("Error parsing law references:", err);
            lawReferences = [];
          }
        }

        // Detect case type from content since it's not stored in the database
        const caseType = detectCaseType(content);

        // Extract analysis sections using the enhanced utils
        const { 
          relevantLaw, 
          preliminaryAnalysis, 
          potentialIssues, 
          followUpQuestions,
          remedies
        } = extractAnalysisSections(content);
        
        // Extract strengths and weaknesses with case type awareness
        const { strengths, weaknesses } = extractStrengthsWeaknesses(content, caseType);
        
        // Calculate prediction percentages considering case type
        const outcome = calculatePredictionPercentages(
          content, 
          { strengths, weaknesses },
          caseType
        );

        // Create analysis data structure
        setAnalysisData({
          outcome: {
            defense: outcome.defense.toString(),
            prosecution: outcome.prosecution.toString(),
          },
          legalAnalysis: {
            relevantLaw,
            preliminaryAnalysis,
            potentialIssues,
            followUpQuestions
          },
          strengths,
          weaknesses,
          conversationSummary: "Client described a slip and fall incident at a local grocery store. Initial medical assessment confirms sprained wrist and back strain. Client reports ongoing pain and inability to perform normal work duties as a contractor.",
          lawReferences,
          caseType,
          remedies
        });
      } else {
        // No analysis found - set null and show a toast
        setAnalysisData(null);
        toast({
          title: "No Analysis Found",
          description: "Generate a new analysis to view case insights.",
        });
      }
    } catch (err: any) {
      console.error("Error fetching analysis:", err);
      setError(err.message || "Failed to load analysis data");
      toast({
        title: "Error",
        description: "Failed to load case analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    analysisData,
    isLoading: isLoading || isGenerating,
    error,
    generateNewAnalysis
  };
};
