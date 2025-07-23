
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
      const searchQuery = `Find similar legal cases for: ${latestAnalysis.case_type || "legal matter"}. Key facts: ${latestAnalysis.content.substring(0, 400)}`;
      
      const result = await searchSimilarCasesWithPerplexity(searchQuery, latestAnalysis.content.substring(0, 1000));
      
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
    
    console.log("Parsing Perplexity content:", content.substring(0, 200));
    
    // First try to parse as JSON array (from our improved prompt)
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonCases = JSON.parse(jsonMatch[0]);
        if (Array.isArray(jsonCases)) {
          const cases: SimilarCase[] = jsonCases
            .filter(c => c.caseName && c.caseName.length > 5 && !isAiThinkingContent(c.caseName))
            .slice(0, 5)
            .map((c, index) => ({
              source: "perplexity" as const,
              clientId: null,
              clientName: c.caseName,
              similarity: 85 + Math.random() * 10,
              relevantFacts: c.relevantFacts || "Case facts available in full record",
              outcome: c.outcome || "Court decision details available",
              court: c.court || undefined,
              citation: c.citation || undefined,
              dateDecided: c.date || undefined,
              url: c.url || null,
              citations: citations,
              agentReasoning: `Found via Perplexity Research using ${perplexityResult.model}`
            }));
          
          console.log(`Parsed ${cases.length} cases from JSON format`);
          return cases;
        }
      }
    } catch (e) {
      console.log("JSON parsing failed, trying fallback methods");
    }
    
    // Remove AI thinking and analysis content more aggressively
    const cleanContent = content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/Let me[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/Based on[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/I[\s]*(?:need to|will|should|must)[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/Here are[\s\S]*?(?:cases|results)[\s\S]*?:/gi, '')
      .replace(/Analysis[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/Research[\s\S]*?(?:shows|indicates|reveals)[\s\S]*?(?=\*\*|$)/gi, '')
      .replace(/We[\s]*(?:found|have|can see)[\s\S]*?(?=\*\*|$)/gi, '')
      .trim();
    
    const cases: SimilarCase[] = [];
    
    // Look for structured case format
    const casePattern = /\*\*Case Name\*\*:\s*([^\n]+)[\s\S]*?\*\*Court\*\*:\s*([^\n]*)[\s\S]*?\*\*Citation\*\*:\s*([^\n]*)[\s\S]*?\*\*Date\*\*:\s*([^\n]*)[\s\S]*?\*\*Relevant Facts\*\*:\s*([^\n*]+)[\s\S]*?\*\*Outcome\*\*:\s*([^\n*]+)/g;
    
    let match;
    while ((match = casePattern.exec(cleanContent)) !== null && cases.length < 5) {
      const [, caseName, court, citation, date, facts, outcome] = match;
      
      if (caseName && caseName.trim() && !isAiThinkingContent(caseName) && isValidCaseName(caseName)) {
        cases.push({
          source: "perplexity",
          clientId: null,
          clientName: caseName.trim(),
          similarity: 80 + Math.random() * 15,
          relevantFacts: facts?.trim() || "Case facts available in full record",
          outcome: outcome?.trim() || "Court decision details available",
          court: court?.trim() || undefined,
          citation: citation?.trim() || undefined,
          dateDecided: date?.trim() || undefined,
          citations: citations,
          agentReasoning: `Found via Perplexity Research using ${perplexityResult.model}`
        });
      }
    }
    
    // Only use fallback if we have 0 cases and the content looks legitimate
    if (cases.length === 0) {
      const blocks = cleanContent.split(/\n\n+/).filter(block => {
        const b = block.trim();
        return b.length > 50 && 
               !isAiThinkingContent(b) &&
               hasLegalTerminology(b);
      });
      
      // Be very conservative with fallback - only take first block if it looks like a real case
      if (blocks.length > 0) {
        const block = blocks[0];
        const lines = block.split('\n').filter(l => l.trim());
        const title = lines[0]?.replace(/^\*\*|\*\*$/g, '').trim();
        
        if (title && isValidCaseName(title)) {
          cases.push({
            source: "perplexity",
            clientId: null,
            clientName: title.substring(0, 100),
            similarity: 75,
            relevantFacts: block.substring(0, 200) + "...",
            outcome: "See full case details",
            citations: citations,
            agentReasoning: `AI Research via ${perplexityResult.model}`
          });
        }
      }
    }
    
    console.log(`Parsed ${cases.length} cases from Perplexity result`);
    return cases;
  };

  // Helper function to detect AI thinking/analysis content
  const isAiThinkingContent = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const thinkingPatterns = [
      'let me', 'based on', 'analysis', 'thinking', 'i need to', 'searching for',
      'we found', 'we have', 'we can see', 'research shows', 'research indicates',
      'research reveals', 'here are', 'i will', 'i should', 'i must', 'we should',
      'we must', 'we need', 'review', 'examine', 'looking at', 'considering'
    ];
    
    return thinkingPatterns.some(pattern => lowerText.includes(pattern));
  };

  // Helper function to validate case names
  const isValidCaseName = (caseName: string): boolean => {
    const name = caseName.trim();
    
    // Must have reasonable length
    if (name.length < 5 || name.length > 200) return false;
    
    // Should contain typical case name patterns
    const casePatterns = [
      /v\./i,           // "v." for versus
      /vs?\./i,         // "vs." or "v." 
      /\s+v\s+/i,       // " v " for versus
      /\w+\s+v\s+\w+/i, // Name v Name
      /\d{4}/,          // Year
      /court/i,         // Contains "court"
      /case/i,          // Contains "case"
      /\w+\s+\w+/       // At least two words
    ];
    
    // Should match at least one pattern or be a reasonable legal title
    return casePatterns.some(pattern => pattern.test(name)) || 
           (name.includes(' ') && !isAiThinkingContent(name));
  };

  // Helper function to check for legal terminology
  const hasLegalTerminology = (text: string): boolean => {
    const legalTerms = [
      'court', 'judge', 'ruling', 'decision', 'verdict', 'plaintiff', 'defendant',
      'case', 'lawsuit', 'litigation', 'appeal', 'damages', 'liability', 'negligence',
      'statute', 'law', 'legal', 'attorney', 'counsel', 'brief', 'motion', 'order'
    ];
    
    const lowerText = text.toLowerCase();
    return legalTerms.some(term => lowerText.includes(term));
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
