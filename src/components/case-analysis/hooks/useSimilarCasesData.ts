
import { useState, useCallback, useEffect } from "react";
import { searchSimilarCases } from "@/utils/openaiService";
import { useToast } from "@/hooks/use-toast";
import { saveSimilarCases, loadSimilarCases, checkSimilarCasesExist } from "@/utils/api/similarCasesApiService";

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
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const { toast } = useToast();

  // Load similar cases from database for a specific legal analysis with fallback
  const loadSimilarCasesFromDb = useCallback(async (legalAnalysisId: string) => {
    if (!clientId || !legalAnalysisId) return;
    
    setIsLoadingFromDb(true);
    
    try {
      console.log("Loading similar cases from database for analysis:", legalAnalysisId);
      const result = await loadSimilarCases(clientId, legalAnalysisId);
      
      if (result.error) {
        console.error("Error loading similar cases from DB:", result.error);
        setSimilarCases([]);
        setAnalysisFound(true);
        setFallbackUsed(false);
      } else if (result.similarCases.length > 0) {
        console.log("✅ Loaded saved similar cases:", result.similarCases.length);
        setSimilarCases(result.similarCases);
        setAnalysisFound(result.metadata?.analysisFound !== false);
        setFallbackUsed(result.metadata?.fallbackUsed || false);
        
        // Don't show toast for silent loading to avoid spam
        console.log(`Loaded ${result.similarCases.length} similar cases from database`);
      } else {
        // No saved similar cases found
        setSimilarCases([]);
        setAnalysisFound(true);
        setFallbackUsed(false);
      }
    } catch (err: any) {
      console.error("Exception loading similar cases from DB:", err);
      setSimilarCases([]);
      setAnalysisFound(true);
      setFallbackUsed(false);
    } finally {
      setIsLoadingFromDb(false);
    }
  }, [clientId]);

  // Fetch new similar cases from API and save to database
  const fetchSimilarCases = useCallback(async (legalAnalysisId?: string) => {
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
        
        // Always try to save to database with the current analysis ID
        if (result.similarCases.length > 0) {
          // Get the most recent analysis ID for this client to ensure we save to the right place
          const getCurrentAnalysisId = async () => {
            try {
              const { supabase } = await import("@/integrations/supabase/client");
              let query = supabase
                .from("legal_analyses")
                .select("id")
                .eq("client_id", clientId);

              const { data } = await query
                .order("created_at", { ascending: false })
                .limit(1);

              return data && data.length > 0 ? data[0].id : null;
            } catch (error) {
              console.error("Error fetching current analysis ID:", error);
              return null;
            }
          };

          const currentAnalysisId = legalAnalysisId || await getCurrentAnalysisId();
          
          if (currentAnalysisId) {
            const metadata = {
              fallbackUsed: result.fallbackUsed,
              analysisFound: result.analysisFound,
              searchStrategy: result.searchStrategy,
              caseType: result.caseType
            };
            
            const saveResult = await saveSimilarCases(clientId, currentAnalysisId, result.similarCases, metadata);
            if (saveResult.success) {
              console.log("✅ Similar cases saved to database");
            } else {
              console.error("Failed to save similar cases:", saveResult.error);
            }
          }
        }
        
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

  // Check if similar cases exist for a legal analysis
  const checkSimilarCasesForAnalysis = useCallback(async (legalAnalysisId: string) => {
    if (!clientId || !legalAnalysisId) return false;
    
    try {
      const result = await checkSimilarCasesExist(clientId, legalAnalysisId);
      return result.exists;
    } catch (err: any) {
      console.error("Error checking similar cases existence:", err);
      return false;
    }
  }, [clientId]);

  return {
    similarCases,
    isSimilarCasesLoading: isSimilarCasesLoading || isLoadingFromDb,
    analysisFound,
    fallbackUsed,
    fetchSimilarCases,
    loadSimilarCasesFromDb,
    checkSimilarCasesForAnalysis
  };
};
