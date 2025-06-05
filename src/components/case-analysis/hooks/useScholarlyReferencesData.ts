
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScholarlyArticle, searchGoogleScholar, getScholarlyReferences } from "@/utils/api/scholarApiService";
import { useToast } from "@/hooks/use-toast";

export const useScholarlyReferencesData = (clientId: string) => {
  const [scholarlyReferences, setScholarlyReferences] = useState<ScholarlyArticle[]>([]);
  const [isScholarlyReferencesLoading, setIsScholarlyReferencesLoading] = useState(false);
  const { toast } = useToast();

  const fetchScholarlyReferences = useCallback(async (caseType?: string) => {
    if (!clientId) return;
    
    setIsScholarlyReferencesLoading(true);
    
    try {
      console.log("Auto-fetching scholarly references for client:", clientId, "case type:", caseType);
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

  return {
    scholarlyReferences,
    isScholarlyReferencesLoading,
    fetchScholarlyReferences,
    handleScholarSearch
  };
};
