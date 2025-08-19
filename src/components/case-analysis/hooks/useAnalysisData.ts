
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { extractLegalCitations, mapCitationsToKnowledgeBase, generateDirectPdfUrl } from "@/utils/lawReferences/knowledgeBaseMapping";
import { cleanupDuplicateAnalyses } from "@/utils/duplicateCleanupService";

export const useAnalysisData = (clientId: string, caseId?: string) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchAnalysisData = useCallback(async () => {
    if (!clientId) return;
    
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      console.log(`Fetching analysis data for client: ${clientId}${caseId ? `, case: ${caseId}` : ''}`);
      
      // First, clean up any duplicate analyses for this client
      const cleanupResult = await cleanupDuplicateAnalyses(clientId);
      if (cleanupResult.duplicatesRemoved > 0) {
        console.log(`Cleaned up ${cleanupResult.duplicatesRemoved} duplicate analyses for client ${clientId}`);
      }

      let analyses = null;

      // If case ID is provided, ONLY look for case-specific analysis
      if (caseId) {
        console.log(`Looking for case-specific analysis for case: ${caseId}`);
        const { data: caseAnalyses, error: caseError } = await supabase
          .from("legal_analyses")
          .select("*")
          .eq("client_id", clientId)
          .eq("case_id", caseId)
          .eq("validation_status", "validated")  // Only validated analyses
          .not("analysis_type", "in", "(3-agent-coordination,coordinator-research)")
          .order("created_at", { ascending: false });

        if (caseError) {
          throw new Error(`Failed to fetch case-specific analysis: ${caseError.message}`);
        }

        analyses = caseAnalyses;
        console.log(`Found ${analyses?.length || 0} case-specific analysis records`);
        
        // 🎯 Filter and prioritize legitimate analyses
        if (analyses && analyses.length > 1) {
          // First, prefer case-analysis and client-intake types
          const legitimateAnalyses = analyses.filter(a => 
            a.analysis_type === 'case-analysis' || 
            a.analysis_type === 'client-intake' ||
            a.analysis_type === 'direct-analysis'
          );
          
          if (legitimateAnalyses.length > 0) {
            console.log(`📋 Using legitimate analysis types, found ${legitimateAnalyses.length} options`);
            analyses = legitimateAnalyses;
            
            // Then prefer consumer-protection within legitimate analyses
            const consumerAnalyses = legitimateAnalyses.filter(a => a.case_type === 'consumer-protection');
            if (consumerAnalyses.length > 0) {
              console.log(`📋 Preferring consumer-protection analysis over other types`);
              analyses = [consumerAnalyses[0]];
            }
          }
        }
      } else {
        // If no case ID, look for client-level analysis (case_id IS NULL)
        console.log(`Looking for client-level analysis (no case specified)`);
        const { data: clientAnalyses, error: clientError } = await supabase
          .from("legal_analyses")
          .select("*")
          .eq("client_id", clientId)
          .is("case_id", null)
          .eq("validation_status", "validated")  // Only validated analyses
          .not("analysis_type", "in", "(3-agent-coordination,coordinator-research)")
          .order("created_at", { ascending: false });

        if (clientError) {
          throw new Error(`Failed to fetch client-level analysis: ${clientError.message}`);
        }

        analyses = clientAnalyses;
        console.log(`Found ${analyses?.length || 0} client-level analysis records`);
        
        // 🎯 Filter and prioritize legitimate analyses for client-level too
        if (analyses && analyses.length > 1) {
          // First, prefer case-analysis and client-intake types
          const legitimateAnalyses = analyses.filter(a => 
            a.analysis_type === 'case-analysis' || 
            a.analysis_type === 'client-intake' ||
            a.analysis_type === 'direct-analysis'
          );
          
          if (legitimateAnalyses.length > 0) {
            console.log(`📋 Using legitimate analysis types, found ${legitimateAnalyses.length} options`);
            analyses = legitimateAnalyses;
            
            // Then prefer consumer-protection within legitimate analyses
            const consumerAnalyses = legitimateAnalyses.filter(a => a.case_type === 'consumer-protection');
            if (consumerAnalyses.length > 0) {
              console.log(`📋 Preferring consumer-protection analysis over other types`);
              analyses = [consumerAnalyses[0]];
            }
          }
        }
      }

      if (analyses && analyses.length > 0) {
        const analysis = analyses[0];
        console.log(`Using analysis: ID=${analysis.id}, case_id=${analysis.case_id}, case_type=${analysis.case_type}, created_at=${analysis.created_at}`);
        
        // Extract legal citations from the analysis content and map to knowledge base
        const extractedCitations = extractLegalCitations(analysis.content);
        console.log("Extracted citations from analysis:", extractedCitations);
        
        const knowledgeBaseDocs = mapCitationsToKnowledgeBase(extractedCitations);
        console.log("Mapped knowledge base documents:", knowledgeBaseDocs);
        
        // Convert knowledge base docs to law references format with direct PDF URLs
        const lawReferences = knowledgeBaseDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          url: generateDirectPdfUrl(doc.filename),
          content: `Click to view the full ${doc.title} document.`
        }));
        
        // Transform the analysis into the expected format
        const transformedData: AnalysisData = {
          id: analysis.id,
          legalAnalysis: {
            relevantLaw: "",
            preliminaryAnalysis: "",
            potentialIssues: "",
            followUpQuestions: []
          },
          strengths: [],
          weaknesses: [],
          conversationSummary: "",
          outcome: {
            defense: 65,
            prosecution: 35
          },
          timestamp: analysis.timestamp || analysis.created_at || new Date().toISOString(),
          lawReferences: lawReferences,
          caseType: analysis.case_type || "general",
          remedies: "",
          rawContent: analysis.content,
          validationStatus: analysis.validation_status
        };

        setAnalysisData(transformedData);
        console.log("Analysis data set successfully with case type:", analysis.case_type);
      } else {
        console.log(`No analysis found for the specified criteria`);
        setAnalysisData(null);
      }
      
    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      setAnalysisError(err.message);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [clientId, caseId]);

  return {
    analysisData,
    isAnalysisLoading,
    analysisError,
    fetchAnalysisData
  };
};
