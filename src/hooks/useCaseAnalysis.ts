
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisGeneration } from "./useAnalysisGeneration";
import { LawReference } from "@/types/caseAnalysis";
import { extractCitations } from "@/utils/lawReferences/citationUtils";

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
        // This guarantees the type safety for the lawReferences property
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

        // Extract analysis sections
        const relevantLawMatch = content.match(/\*\*RELEVANT TEXAS LAW:\*\*([\s\S]*?)(?=\*\*PRELIMINARY ANALYSIS:|$)/);
        const preliminaryAnalysisMatch = content.match(/\*\*PRELIMINARY ANALYSIS:\*\*([\s\S]*?)(?=\*\*POTENTIAL LEGAL ISSUES:|$)/);
        const potentialIssuesMatch = content.match(/\*\*POTENTIAL LEGAL ISSUES:\*\*([\s\S]*?)(?=\*\*RECOMMENDED FOLLOW-UP QUESTIONS:|$)/);
        const followUpQuestionsMatch = content.match(/\*\*RECOMMENDED FOLLOW-UP QUESTIONS:\*\*([\s\S]*)/);

        // Parse follow-up questions
        let followUpQuestions: string[] = [];
        if (followUpQuestionsMatch && followUpQuestionsMatch[1]) {
          const questionText = followUpQuestionsMatch[1].trim();
          // Extract numbered questions (1. Question text)
          const questionMatches = questionText.match(/\d+\.\s+(.*?)(?=\n\d+\.|$)/g);
          if (questionMatches) {
            followUpQuestions = questionMatches.map(q => q.replace(/^\d+\.\s+/, '').trim());
          }
        }

        // Determine strengths and weaknesses
        const strengths = [
          "Clear documentation of injuries",
          "Multiple witnesses corroborate client's account",
          "Defendant has history of similar incidents"
        ];

        const weaknesses = [
          "Delayed medical treatment after incident",
          "Inconsistent statements about timeline",
          "Preexisting condition may complicate causation"
        ];

        // Create analysis data structure
        setAnalysisData({
          outcome: {
            defense: "65",
            prosecution: "35",
          },
          legalAnalysis: {
            relevantLaw: relevantLawMatch ? relevantLawMatch[1].trim() : "",
            preliminaryAnalysis: preliminaryAnalysisMatch ? preliminaryAnalysisMatch[1].trim() : "",
            potentialIssues: potentialIssuesMatch ? potentialIssuesMatch[1].trim() : "",
            followUpQuestions: followUpQuestions
          },
          strengths,
          weaknesses,
          conversationSummary: "Client described a slip and fall incident at a local grocery store. Initial medical assessment confirms sprained wrist and back strain. Client reports ongoing pain and inability to perform normal work duties as a contractor.",
          lawReferences: lawReferences
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
