
import { useState, useEffect } from "react";
import { searchGoogleScholar, getScholarlyReferences, ScholarlyArticle } from "@/utils/api/scholarApiService";
import { useToast } from "@/hooks/use-toast";

export const useScholarlyReferences = (clientId?: string, caseType?: string) => {
  const [references, setReferences] = useState<ScholarlyArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchReferences();
    }
  }, [clientId, caseType]);

  const fetchReferences = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { results, error } = await getScholarlyReferences(clientId, caseType);
      
      if (error) {
        setError(error);
        toast({
          title: "Error",
          description: `Failed to fetch scholarly references: ${error}`,
          variant: "destructive",
        });
      } else {
        setReferences(results);
      }
    } catch (err: any) {
      console.error("Error in useScholarlyReferences:", err);
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: "Failed to fetch scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchReferences = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { results, error } = await searchGoogleScholar(query);
      
      if (error) {
        setError(error);
        toast({
          title: "Search Error",
          description: error,
          variant: "destructive",
        });
      } else {
        setReferences(results);
        toast({
          title: "Search Results",
          description: `Found ${results.length} scholarly articles related to your query.`,
        });
      }
    } catch (err: any) {
      console.error("Error searching scholarly references:", err);
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Search Error",
        description: "Failed to search scholarly references. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    references,
    isLoading,
    error,
    fetchReferences,
    searchReferences
  };
};
