
import { useState, useCallback, useEffect } from "react";
import { searchSimilarCasesWithPerplexity } from "@/utils/api/perplexityApiService";
import { useToast } from "@/hooks/use-toast";
import { saveSimilarCases, loadSimilarCases, checkSimilarCasesExist } from "@/utils/api/similarCasesApiService";
import { supabase } from "@/integrations/supabase/client";

export interface SimilarCase {
  source: "internal" | "courtlistener" | "perplexity";
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
  citations?: string[];
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

  // Fetch new similar cases using Perplexity and save to database
  const fetchSimilarCases = useCallback(async (legalAnalysisId?: string) => {
    if (!clientId) return;
    
    setIsSimilarCasesLoading(true);
    
    try {
      console.log("Fetching similar cases with Perplexity for client:", clientId);
      
      // Get legal analysis for context
      const { data: analysisData } = await supabase
        .from("legal_analyses")
        .select("content, case_type")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);
      
      const latestAnalysis = analysisData?.[0];
      if (!latestAnalysis) {
        setAnalysisFound(false);
        setSimilarCases([]);
        toast({
          title: "Analysis Required",
          description: "Please generate a legal analysis first to search for similar cases.",
          variant: "destructive",
        });
        return;
      }
      
      // Create search query from analysis
      const searchQuery = `Find similar legal cases for: ${latestAnalysis.case_type || "legal matter"}. Context: ${latestAnalysis.content.substring(0, 500)}`;
      
      const result = await searchSimilarCasesWithPerplexity(searchQuery, latestAnalysis.content);
      
      if (result.error) {
        console.error("Error fetching similar cases:", result.error);
        toast({
          title: "Error",
          description: `Failed to fetch similar cases: ${result.error}`,
          variant: "destructive",
        });
        setSimilarCases([]);
        setAnalysisFound(true);
        setFallbackUsed(false);
      } else if (result.result) {
        // Parse Perplexity result into similar cases
        const perplexityCases = parseSimilarCasesFromPerplexity(result.result);
        
        console.log("Successfully fetched similar cases:", perplexityCases.length);
        setSimilarCases(perplexityCases);
        setAnalysisFound(true);
        setFallbackUsed(false);
        
        // Save to database and Perplexity research table
        if (perplexityCases.length > 0) {
          const getCurrentAnalysisId = async () => {
            try {
              const { data } = await supabase
                .from("legal_analyses")
                .select("id")
                .eq("client_id", clientId)
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
            // Save similar cases
            const metadata = {
              fallbackUsed: false,
              analysisFound: true,
              searchStrategy: "perplexity-deep-research",
              caseType: latestAnalysis.case_type
            };
            
            const saveResult = await saveSimilarCases(clientId, currentAnalysisId, perplexityCases, metadata);
            if (saveResult.success) {
              console.log("✅ Similar cases saved to database");
            }
            
            // Save Perplexity research
            const { savePerplexityResearch } = await import("@/utils/api/perplexityApiService");
            await savePerplexityResearch(clientId, currentAnalysisId, result.result, "similar-cases");
          }
        }
        
        if (perplexityCases.length === 0) {
          toast({
            title: "No Similar Cases",
            description: "No similar cases found for this analysis.",
          });
        } else {
          toast({
            title: "Similar Cases Found",
            description: `Found ${perplexityCases.length} similar case${perplexityCases.length > 1 ? 's' : ''} using Perplexity Deep Research.`,
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

  // Parse Perplexity result into similar cases format
  const parseSimilarCasesFromPerplexity = (perplexityResult: any): SimilarCase[] => {
    const content = perplexityResult.content || "";
    const citations = perplexityResult.citations || [];
    
    // Simple parsing - in a real implementation, you'd want more sophisticated parsing
    const cases: SimilarCase[] = [];
    
    // Split content by case markers or paragraphs
    const caseBlocks = content.split(/\n\n|\*\*Case \d+|\d+\./g).filter(block => block.trim().length > 50);
    
    caseBlocks.forEach((block, index) => {
      if (block.trim()) {
        // Extract case information (simplified parsing)
        const lines = block.split('\n').filter(line => line.trim());
        const caseName = lines[0]?.replace(/^\*\*|\*\*$/g, '').trim() || `Similar Case ${index + 1}`;
        
        cases.push({
          source: "perplexity",
          clientId: null,
          clientName: caseName,
          similarity: 85, // Default similarity score
          relevantFacts: block.substring(0, 300) + (block.length > 300 ? "..." : ""),
          outcome: "See full case details for outcome information",
          citations: citations,
          agentReasoning: `Found via Perplexity Deep Research using ${perplexityResult.model}`
        });
      }
    });
    
    return cases.slice(0, 5); // Limit to 5 cases
  };

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
