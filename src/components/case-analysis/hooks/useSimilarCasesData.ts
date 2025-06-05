
import { useState, useCallback } from "react";
import { searchSimilarCases } from "@/utils/openaiService";
import { useToast } from "@/hooks/use-toast";

export interface SimilarCase {
  source: "internal" | "courtlistener";
  clientId: string | null;
  clientName: string;
  similarity: number;
  relevantFacts: string;
  outcome: string;
  court?: string;
  citation?: string;
  dateDecided?: string;
  url?: string | null;
  agentReasoning?: string;
}

export const useSimilarCasesData = (clientId: string) => {
  const [similarCases, setSimilarCases] = useState<SimilarCase[]>([]);
  const [isSimilarCasesLoading, setIsSimilarCasesLoading] = useState(false);
  const [analysisFound, setAnalysisFound] = useState(true);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const { toast } = useToast();

  const fetchSimilarCases = useCallback(async () => {
    if (!clientId) return;
    
    setIsSimilarCasesLoading(true);
    
    try {
      console.log("Fetching similar cases for client:", clientId);
      const result = await searchSimilarCases(clientId);
      
      if (result.error) {
        console.error("Error fetching similar cases:", result.error);
        toast({
          title: "Error",
          description: `Failed to fetch similar cases: ${result.error}`,
          variant: "destructive",
        });
        setSimilarCases([]);
      } else {
        console.log("Successfully fetched similar cases:", result.similarCases.length);
        setSimilarCases(result.similarCases);
        setAnalysisFound(result.analysisFound !== false);
        setFallbackUsed(result.fallbackUsed || false);
        
        if (result.similarCases.length === 0) {
          toast({
            title: "No Similar Cases",
            description: result.message || "No similar cases found for this analysis.",
          });
        } else {
          toast({
            title: "Similar Cases Found",
            description: `Found ${result.similarCases.length} similar case${result.similarCases.length > 1 ? 's' : ''}.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Exception in fetchSimilarCases:", err);
      toast({
        title: "Error",
        description: "Failed to fetch similar cases. Please try again.",
        variant: "destructive",
      });
      setSimilarCases([]);
    } finally {
      setIsSimilarCasesLoading(false);
    }
  }, [clientId, toast]);

  return {
    similarCases,
    isSimilarCasesLoading,
    analysisFound,
    fallbackUsed,
    fetchSimilarCases
  };
};
