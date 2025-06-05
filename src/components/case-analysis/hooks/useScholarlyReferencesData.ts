
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ScholarlyArticle, 
  searchGoogleScholar, 
  getScholarlyReferences,
  saveScholarlyReferences,
  loadScholarlyReferences,
  checkScholarlyReferencesExist
} from "@/utils/api/scholarApiService";
import { useToast } from "@/hooks/use-toast";

export const useScholarlyReferencesData = (clientId: string) => {
  const [scholarlyReferences, setScholarlyReferences] = useState<ScholarlyArticle[]>([]);
  const [isScholarlyReferencesLoading, setIsScholarlyReferencesLoading] = useState(false);
  const { toast } = useToast();

  // Load scholarly references from database for a specific legal analysis
  const loadScholarlyReferencesFromDb = useCallback(async (legalAnalysisId: string) => {
    if (!clientId || !legalAnalysisId) return;
    
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Loading scholarly references from database for analysis:", legalAnalysisId);
      const result = await loadScholarlyReferences(clientId, legalAnalysisId);
      
      if (result.error) {
        console.error("Error loading scholarly references from DB:", result.error);
      } else if (result.references.length > 0) {
        console.log("✅ Loaded saved scholarly references:", result.references.length);
        setScholarlyReferences(result.references);
        
        toast({
          title: "Scholarly References Loaded",
          description: `Loaded ${result.references.length} previously found scholarly references.`,
        });
      } else {
        // No saved scholarly references found
        setScholarlyReferences([]);
      }
    } catch (err: any) {
      console.error("Exception loading scholarly references from DB:", err);
    } finally {
      setIsScholarlyReferencesLoading(false);
    }
  }, [clientId, toast]);

  // Fetch new scholarly references from API and save to database
  const fetchScholarlyReferences = useCallback(async (caseType?: string, legalAnalysisId?: string) => {
    if (!clientId) return;
    
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Fetching scholarly references for client:", clientId, "case type:", caseType);
      const { results, error } = await getScholarlyReferences(clientId, caseType);
      
      if (error) {
        console.error("Error fetching scholarly references:", error);
        if (error.includes("SerpAPI") || error.includes("not configured")) {
          toast({
            title: "Configuration Required",
            description: "Google Scholar search requires API configuration. Contact administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch scholarly references: ${error}`,
            variant: "destructive",
          });
        }
      } else {
        console.log("Successfully fetched scholarly references:", results.length);
        setScholarlyReferences(results);
        
        // Save to database if we have a legal analysis ID
        if (legalAnalysisId && results.length > 0) {
          const saveResult = await saveScholarlyReferences(clientId, legalAnalysisId, results, caseType);
          if (saveResult.success) {
            console.log("✅ Scholarly references saved to database");
          } else {
            console.error("Failed to save scholarly references:", saveResult.error);
          }
        }
        
        if (results.length === 0) {
          toast({
            title: "No Results",
            description: "No scholarly articles found for this case analysis.",
          });
        }
      }
    } catch (err: any) {
      console.error("Exception in fetchScholarlyReferences:", err);
      toast({
        title: "Error",
        description: "Failed to fetch scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScholarlyReferencesLoading(false);
    }
  }, [clientId, toast]);

  const handleScholarSearch = useCallback(async (query: string) => {
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Searching scholarly references with query:", query);
      const { results, error } = await searchGoogleScholar(query);
      
      if (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: error,
          variant: "destructive",
        });
      } else {
        setScholarlyReferences(results);
        toast({
          title: "Search Results",
          description: `Found ${results.length} scholarly articles related to your query.`,
        });
      }
    } catch (err: any) {
      console.error("Error searching scholarly references:", err);
      toast({
        title: "Search Error",
        description: "Failed to search scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScholarlyReferencesLoading(false);
    }
  }, [toast]);

  // Check if scholarly references exist for a legal analysis
  const checkScholarlyReferencesForAnalysis = useCallback(async (legalAnalysisId: string) => {
    if (!clientId || !legalAnalysisId) return false;
    
    try {
      const result = await checkScholarlyReferencesExist(clientId, legalAnalysisId);
      return result.exists;
    } catch (err: any) {
      console.error("Error checking scholarly references existence:", err);
      return false;
    }
  }, [clientId]);

  return {
    scholarlyReferences,
    isScholarlyReferencesLoading,
    fetchScholarlyReferences,
    handleScholarSearch,
    loadScholarlyReferencesFromDb,
    checkScholarlyReferencesForAnalysis
  };
};
