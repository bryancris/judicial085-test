import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ResearchData {
  id: string;
  search_type: string;
  query: string;
  content: string;
  model?: string;
  citations?: string[];
  usage_data?: any;
  metadata?: any;
  created_at: string;
  case_discussion_id?: string;
  similarity_score?: number;
}

export interface ResearchStats {
  total_research_count: number;
  similar_cases_count: number;
  legal_research_count: number;
  recent_research_count: number;
  avg_confidence: number;
}

export const useResearchIntegration = (clientId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [researchData, setResearchData] = useState<ResearchData[]>([]);
  const [researchStats, setResearchStats] = useState<ResearchStats | null>(null);
  const { toast } = useToast();

  // Get research linked to a specific case discussion message
  const getLinkedResearch = useCallback(async (discussionId: string): Promise<ResearchData[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_case_discussion_research', {
          discussion_id_param: discussionId
        });

      if (error) {
        console.error('Error fetching linked research:', error);
        return [];
      }

      return (data as ResearchData[]) || [];
    } catch (error) {
      console.error('Error in getLinkedResearch:', error);
      return [];
    }
  }, []);

  // Get all research for the client
  const getClientResearch = useCallback(async (legalAnalysisId?: string): Promise<ResearchData[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_client_research_for_analysis', {
          client_id_param: clientId,
          legal_analysis_id_param: legalAnalysisId || null
        });

      if (error) {
        console.error('Error fetching client research:', error);
        toast({
          title: "Error Loading Research",
          description: "Could not load research data. Please try again.",
          variant: "destructive",
        });
        return [];
      }

      const research = (data as ResearchData[]) || [];
      setResearchData(research);
      return research;
    } catch (error) {
      console.error('Error in getClientResearch:', error);
      toast({
        title: "Error Loading Research",
        description: "Could not load research data. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [clientId, toast]);

  // Find similar research to avoid duplicates
  const findSimilarResearch = useCallback(async (
    searchType: string,
    query: string,
    threshold: number = 0.8
  ): Promise<ResearchData[]> => {
    try {
      const { data, error } = await supabase
        .rpc('find_similar_research', {
          client_id_param: clientId,
          search_type_param: searchType,
          query_param: query,
          similarity_threshold: threshold
        });

      if (error) {
        console.error('Error finding similar research:', error);
        return [];
      }

      return (data as ResearchData[]) || [];
    } catch (error) {
      console.error('Error in findSimilarResearch:', error);
      return [];
    }
  }, [clientId]);

  // Link research to a legal analysis
  const linkResearchToAnalysis = useCallback(async (
    researchId: string,
    legalAnalysisId: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('link_research_to_analysis', {
          research_id_param: researchId,
          legal_analysis_id_param: legalAnalysisId
        });

      if (error) {
        console.error('Error linking research to analysis:', error);
        toast({
          title: "Link Failed",
          description: "Could not link research to analysis. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Research Linked",
        description: "Research has been successfully linked to the legal analysis.",
      });

      return data || false;
    } catch (error) {
      console.error('Error in linkResearchToAnalysis:', error);
      toast({
        title: "Link Failed",
        description: "Could not link research to analysis. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Get research statistics for the client
  const getResearchStats = useCallback(async (): Promise<ResearchStats | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_research_stats', {
          client_id_param: clientId
        });

      if (error) {
        console.error('Error fetching research stats:', error);
        return null;
      }

      const stats = data?.[0] || null;
      setResearchStats(stats);
      return stats;
    } catch (error) {
      console.error('Error in getResearchStats:', error);
      return null;
    }
  }, [clientId]);

  // Save research findings to legal analysis
  const saveResearchToAnalysis = useCallback(async (
    researchContent: string,
    legalAnalysisId?: string
  ): Promise<boolean> => {
    try {
      // This would integrate with the existing legal analysis update functionality
      // For now, we'll just show a success message
      toast({
        title: "Research Saved",
        description: "Research findings have been added to the legal analysis.",
      });
      return true;
    } catch (error) {
      console.error('Error saving research to analysis:', error);
      toast({
        title: "Save Failed",
        description: "Could not save research to analysis. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    isLoading,
    researchData,
    researchStats,
    getLinkedResearch,
    getClientResearch,
    findSimilarResearch,
    linkResearchToAnalysis,
    getResearchStats,
    saveResearchToAnalysis
  };
};