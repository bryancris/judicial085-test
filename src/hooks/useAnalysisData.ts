import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";
import { extractAnalysisSections } from "@/utils/analysisParsingUtils";

export interface AnalysisData {
  id?: string; // Add analysis ID for database operations
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
  lawReferences?: any[];
  caseType?: string;
  validationStatus?: string;
  remedies?: string;
  rawContent?: string; // Add raw content for direct rendering
}

export const useAnalysisData = (clientId?: string, caseId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper function to generate content hash for deduplication
  const generateContentHash = (content: string): string => {
    const cleanContent = content.trim().toLowerCase().replace(/\s+/g, ' ');
    let hash = 0;
    for (let i = 0; i < cleanContent.length; i++) {
      const char = cleanContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString();
  };

  // Helper function to deduplicate analysis records
  const deduplicateAnalyses = (analyses: any[]): any[] => {
    if (!analyses || analyses.length === 0) return analyses;
    
    const seen = new Set<string>();
    const deduplicated = [];
    
    for (const analysis of analyses) {
      const contentHash = generateContentHash(analysis.content);
      if (!seen.has(contentHash)) {
        seen.add(contentHash);
        deduplicated.push(analysis);
      } else {
        console.log("Filtered out duplicate analysis record:", {
          id: analysis.id,
          timestamp: analysis.timestamp,
          contentPreview: analysis.content.substring(0, 100) + "..."
        });
      }
    }
    
    console.log(`Deduplication: ${analyses.length} -> ${deduplicated.length} records`);
    return deduplicated;
  };

  const fetchAnalysisData = useCallback(async () => {
    if (!clientId) {
      setError("No client ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching analysis data for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
      
      let analysisResults = null;

      // If case ID is provided, first try to fetch case-specific analysis
      if (caseId) {
        console.log(`First attempt: Looking for case-specific analysis (case_id = ${caseId})`);
        const { data: caseSpecificResults, error: caseSpecificError } = await supabase
          .from("legal_analyses")
          .select("*")
          .eq("client_id", clientId)
          .eq("case_id", caseId)
          .in("validation_status", ["validated", "pending_review"]) 
          .neq("analysis_type", "3-agent-coordination")
          .neq("analysis_type", "coordinator-research")
          .order("created_at", { ascending: false })
          .limit(1);

        if (caseSpecificError) {
          throw new Error(`Failed to fetch case-specific legal analysis: ${caseSpecificError.message}`);
        }

        if (caseSpecificResults && caseSpecificResults.length > 0) {
          console.log(`Found ${caseSpecificResults.length} case-specific analysis record(s) for case ${caseId}`);
          // Apply deduplication to case-specific results
          const deduplicatedResults = deduplicateAnalyses(caseSpecificResults);
          if (deduplicatedResults.length > 0) {
            analysisResults = [deduplicatedResults[0]]; // Take the most recent after deduplication
          }
        } else {
          console.log(`No case-specific analysis found for case ${caseId}, trying client-level analysis`);
        }
      }

      // If no case-specific analysis found (or no case ID provided), try client-level analysis
      if (!analysisResults) {
        console.log(`Fallback: Looking for client-level analysis (case_id IS NULL)`);
        const { data: clientLevelResults, error: clientLevelError } = await supabase
          .from("legal_analyses")
          .select("*")
          .eq("client_id", clientId)
          .is("case_id", null)
          .in("validation_status", ["validated", "pending_review"]) 
          .neq("analysis_type", "3-agent-coordination")
          .neq("analysis_type", "coordinator-research")
          .order("created_at", { ascending: false })
          .limit(1);

        if (clientLevelError) {
          throw new Error(`Failed to fetch client-level legal analysis: ${clientLevelError.message}`);
        }

        if (clientLevelResults && clientLevelResults.length > 0) {
          console.log(`Found ${clientLevelResults.length} client-level analysis record(s)`);
          // Apply deduplication to client-level results
          const deduplicatedResults = deduplicateAnalyses(clientLevelResults);
          if (deduplicatedResults.length > 0) {
            analysisResults = [deduplicatedResults[0]]; // Take the most recent after deduplication
          }
        }
      }

      if (!analysisResults || analysisResults.length === 0) {
        console.log(`No legal analysis found for client ${clientId}${caseId ? ` (tried both case-specific and client-level)` : ''}`);
        setAnalysisData(null);
        return;
      }

      const analysis = analysisResults[0];
      console.log("Using analysis record:", analysis);
      console.log("Raw analysis content:", analysis.content);
      console.log("Raw law references from DB:", analysis.law_references);

      // Helper function to safely convert Json to array with better logging
      const safeLawReferences = (lawRefs: Json | null): any[] => {
        console.log("Processing law references from database:", lawRefs);
        if (!lawRefs) {
          console.log("No law references found in database");
          return [];
        }
        if (Array.isArray(lawRefs)) {
          console.log(`Found ${lawRefs.length} law references in database:`, lawRefs.map((ref: any) => ref.title || ref.id));
          return lawRefs;
        }
        if (typeof lawRefs === 'object') {
          console.log("Converting single law reference to array");
          return [lawRefs];
        }
        console.log("Unknown law references format, returning empty array");
        return [];
      };
      
      // Combine with metadata
      const lawReferences = safeLawReferences(analysis.law_references);
      console.log("Final processed law references:", lawReferences);
      
      // Parse sections from the selected analysis content
      const mainSections = extractAnalysisSections(analysis.content || "");
      let relevantLaw = mainSections.relevantLaw || "";
      let caseSummary = mainSections.caseSummary || "";
      let preliminaryAnalysis = mainSections.preliminaryAnalysis || "";

      console.log("Initial extracted sections from selected analysis:", {
        relevantLawLength: relevantLaw.length,
        caseSummaryLength: caseSummary.length,
        preliminaryAnalysisLength: preliminaryAnalysis.length,
      });

      // Try to enrich Case Summary and Relevant Law from client-intake (better formatting)
      try {
        let intakeData: { content: string }[] | null = null;

        // First try case-specific client-intake when caseId is provided
        if (caseId) {
          const { data: intakeCaseSpecific, error: intakeCaseErr } = await supabase
            .from("legal_analyses")
            .select("content")
            .eq("client_id", clientId)
            .eq("analysis_type", "client-intake")
            .eq("case_id", caseId)
            .in("validation_status", ["validated", "pending_review", "pending"]) 
            .order("created_at", { ascending: false })
            .limit(1);
          if (intakeCaseErr) {
            console.warn("Client-intake case-specific lookup failed:", intakeCaseErr.message);
          }
          intakeData = intakeCaseSpecific;
        }

        // If none, try client-level intake (case_id IS NULL)
        if (!intakeData || intakeData.length === 0) {
          const { data: intakeClientLevel, error: intakeClientErr } = await supabase
            .from("legal_analyses")
            .select("content")
            .eq("client_id", clientId)
            .eq("analysis_type", "client-intake")
            .is("case_id", null)
            .in("validation_status", ["validated", "pending_review", "pending"]) 
            .order("created_at", { ascending: false })
            .limit(1);
          if (intakeClientErr) {
            console.warn("Client-intake client-level lookup failed:", intakeClientErr.message);
          }
          intakeData = intakeClientLevel;
        }

        if (intakeData && intakeData.length > 0) {
          const intakeSections = extractAnalysisSections(intakeData[0].content || "");
          if (intakeSections.preliminaryAnalysis && !/No preliminary analysis/i.test(intakeSections.preliminaryAnalysis)) {
            preliminaryAnalysis = intakeSections.preliminaryAnalysis;
            console.log("✅ Using Preliminary Analysis from client-intake (preferred)");
          }
          if (intakeSections.caseSummary && !/No case summary/i.test(intakeSections.caseSummary)) {
            caseSummary = intakeSections.caseSummary;
            console.log("✅ Using Case Summary from client-intake (preferred)");
          }
          if (intakeSections.relevantLaw && !/No relevant law/i.test(intakeSections.relevantLaw)) {
            relevantLaw = intakeSections.relevantLaw;
            console.log("✅ Using Relevant Texas Law from client-intake (preferred)");
          }
        }
      } catch (e) {
        console.warn("Client-intake enrichment failed:", e);
      }

      // Create analysis data with parsed sections and raw content for rendering
      const completeAnalysisData: AnalysisData = {
        id: analysis.id,
        legalAnalysis: {
          relevantLaw,
          preliminaryAnalysis: preliminaryAnalysis,
          potentialIssues: mainSections.potentialIssues || "",
          followUpQuestions: mainSections.followUpQuestions || [],
        },
        strengths: [
          "Documentary evidence supports client's position",
          "Legal precedent favors our arguments",
          "Clear liability chain established"
        ],
        weaknesses: [
          "Burden of proof challenges may arise",
          "Opposing counsel likely to dispute key facts",
          "Damages calculation requires further documentation"
        ],
        conversationSummary: caseSummary,
        outcome: {
          defense: 65,
          prosecution: 35,
        },
        timestamp: analysis.timestamp || analysis.created_at,
        lawReferences: lawReferences,
        caseType: analysis.case_type || extractCaseType(analysis.content),
        validationStatus: analysis.validation_status,
        rawContent: analysis.content
      };

      console.log("Setting analysis data with enriched Case Summary and Relevant Law", {
        relevantLawLength: completeAnalysisData.legalAnalysis.relevantLaw.length,
        caseSummaryLength: completeAnalysisData.conversationSummary.length,
      });
      setAnalysisData(completeAnalysisData);
    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      setError(err.message);
      toast({
        title: "Error loading analysis",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId, caseId, toast]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (clientId) {
      fetchAnalysisData();
    }
  }, [fetchAnalysisData, clientId, caseId]);

  return {
    analysisData,
    isLoading,
    error,
    fetchAnalysisData,
  };
};

// Helper function to extract case type from analysis content
const extractCaseType = (content: string): string | undefined => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes("animal") || lowerContent.includes("cruelty") || lowerContent.includes("boarding")) {
    return "animal-protection";
  }
  if (lowerContent.includes("consumer protection") || lowerContent.includes("deceptive trade practices") || lowerContent.includes("dtpa")) {
    return "consumer-protection";
  }
  if (lowerContent.includes("slip and fall") || lowerContent.includes("premises liability")) {
    return "personal-injury";
  }
  return "general";
};
