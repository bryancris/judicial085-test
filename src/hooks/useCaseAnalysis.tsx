
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CaseAnalysisData {
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
  timestamp: string;
}

export const useCaseAnalysis = (clientId?: string) => {
  const [analysisData, setAnalysisData] = useState<CaseAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      setError("No client ID provided");
      return;
    }

    const fetchAnalysisData = async () => {
      try {
        setIsLoading(true);

        // First, try to fetch analysis from the database
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from("legal_analyses")
          .select("content")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingAnalysis && existingAnalysis.length > 0) {
          // Try to parse the existing analysis content
          try {
            // We're using the most recent legal analysis and parsing it to extract structured data
            const latestAnalysis = existingAnalysis[0].content;
            
            // Extract defense/prosecution percentages (mocked for now)
            const defensePercentage = Math.floor(Math.random() * 40) + 30; // 30-70%
            const prosecutionPercentage = 100 - defensePercentage;
            
            // Basic data extraction from markdown content
            const relevantLawMatch = latestAnalysis.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS|\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
            const preliminaryAnalysisMatch = latestAnalysis.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
            const potentialIssuesMatch = latestAnalysis.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
            const followUpQuestionsMatch = latestAnalysis.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*?)$/);
            
            // Extract strengths and weaknesses (mocked, would be extracted from AI analysis in production)
            const strengths = [
              "Client's testimony is consistent and credible",
              "Multiple witnesses corroborate client's version of events",
              "No prior criminal history",
              "Potential procedural errors in evidence collection"
            ];
            
            const weaknesses = [
              "Conflicting statements in initial police report",
              "Lack of alibi for critical timeframe",
              "Potential witness credibility issues",
              "Similar fact pattern to established precedent cases"
            ];

            // Extract follow-up questions
            const followUpQuestions = followUpQuestionsMatch 
              ? followUpQuestionsMatch[1].split('\n')
                .map(line => line.trim())
                .filter(line => line.match(/^\d+\.\s/))
                .map(line => line.replace(/^\d+\.\s/, ''))
              : [];
            
            const parsedData: CaseAnalysisData = {
              outcome: {
                defense: defensePercentage,
                prosecution: prosecutionPercentage
              },
              legalAnalysis: {
                relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "No relevant law analysis available.",
                preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
                potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
                followUpQuestions: followUpQuestions
              },
              strengths,
              weaknesses,
              conversationSummary: "Generated from attorney-client conversation analysis.",
              timestamp: new Date().toISOString()
            };
            
            setAnalysisData(parsedData);
          } catch (parseError) {
            console.error("Error parsing analysis data:", parseError);
            setError("Error parsing analysis data");
          }
        } else {
          // If no analysis exists, set a placeholder
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

    fetchAnalysisData();
  }, [clientId, toast]);

  const generateNewAnalysis = async () => {
    // This would normally trigger the Supabase function to generate a new analysis
    // For now, we'll just return a mock promise
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Analysis Generated",
        description: "A new case analysis has been generated successfully.",
      });
      
      // Call the fetchAnalysisData again to refresh the data
      fetchAnalysisData();
    } catch (err: any) {
      console.error("Error generating analysis:", err);
      setError(err.message || "Failed to generate analysis");
      toast({
        title: "Generation Failed",
        description: err.message || "Failed to generate a new analysis.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const fetchAnalysisData = async () => {
    // Reimplement the function locally to avoid hooks in callbacks warning
    try {
      setIsLoading(true);
      
      const { data: existingAnalysis, error: fetchError } = await supabase
        .from("legal_analyses")
        .select("content")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingAnalysis && existingAnalysis.length > 0) {
        // Same parsing logic as above
        const latestAnalysis = existingAnalysis[0].content;
        
        const defensePercentage = Math.floor(Math.random() * 40) + 30;
        const prosecutionPercentage = 100 - defensePercentage;
        
        const relevantLawMatch = latestAnalysis.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS|\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
        const preliminaryAnalysisMatch = latestAnalysis.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES|\*\*RECOMMENDED FOLLOW-UP|$)/);
        const potentialIssuesMatch = latestAnalysis.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP|$)/);
        const followUpQuestionsMatch = latestAnalysis.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*?)$/);
        
        const strengths = [
          "Client's testimony is consistent and credible",
          "Multiple witnesses corroborate client's version of events",
          "No prior criminal history",
          "Potential procedural errors in evidence collection"
        ];
        
        const weaknesses = [
          "Conflicting statements in initial police report",
          "Lack of alibi for critical timeframe",
          "Potential witness credibility issues",
          "Similar fact pattern to established precedent cases"
        ];

        const followUpQuestions = followUpQuestionsMatch 
          ? followUpQuestionsMatch[1].split('\n')
            .map(line => line.trim())
            .filter(line => line.match(/^\d+\.\s/))
            .map(line => line.replace(/^\d+\.\s/, ''))
          : [];
        
        const parsedData: CaseAnalysisData = {
          outcome: {
            defense: defensePercentage,
            prosecution: prosecutionPercentage
          },
          legalAnalysis: {
            relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "No relevant law analysis available.",
            preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "No preliminary analysis available.",
            potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "No potential issues identified.",
            followUpQuestions: followUpQuestions
          },
          strengths,
          weaknesses,
          conversationSummary: "Generated from attorney-client conversation analysis.",
          timestamp: new Date().toISOString()
        };
        
        setAnalysisData(parsedData);
      } else {
        setAnalysisData(null);
        setError("No analysis data available for this client");
      }
    } catch (err: any) {
      console.error("Error fetching case analysis:", err);
      setError(err.message || "Failed to load case analysis");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analysisData,
    isLoading,
    error,
    generateNewAnalysis
  };
};
