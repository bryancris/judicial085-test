
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { extractLegalCitations, mapCitationsToKnowledgeBase, generateDirectPdfUrl } from "@/utils/lawReferences/knowledgeBaseMapping";
import { cleanupDuplicateAnalyses } from "@/utils/duplicateCleanupService";
import { extractAnalysisSections, extractStrengthsWeaknesses } from "@/utils/analysisParsingUtils";
import { parseIracAnalysis } from "@/utils/iracParser";

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
          .in("validation_status", ["validated", "pending_review", "pending"])  // Include validated, pending review, and pending
          .neq("analysis_type", "3-agent-coordination")
          // Allow case-analysis from coordinator but exclude deprecated coordinator-research
          .order("created_at", { ascending: false });

        if (caseError) {
          throw new Error(`Failed to fetch case-specific analysis: ${caseError.message}`);
        }

        analyses = caseAnalyses;
        console.log(`Found ${analyses?.length || 0} case-specific analysis records`);

        // If no case-specific analysis, fall back to latest client-level analysis
        if (!analyses || analyses.length === 0) {
          console.log(`No case-specific analysis found, falling back to client-level (case_id IS NULL)`);
          const { data: clientAnalysesFallback, error: clientFallbackError } = await supabase
            .from("legal_analyses")
            .select("*")
            .eq("client_id", clientId)
            .is("case_id", null)
            .in("validation_status", ["validated", "pending_review", "pending"])  // Include validated, pending review, and pending
            .neq("analysis_type", "3-agent-coordination")
            // Allow case-analysis from coordinator but exclude deprecated coordinator-research
            .order("created_at", { ascending: false });

          if (clientFallbackError) {
            throw new Error(`Failed to fetch client-level analysis (fallback): ${clientFallbackError.message}`);
          }

          analyses = clientAnalysesFallback;
          console.log(`Found ${analyses?.length || 0} client-level analysis records (fallback)`);
        }
        
        // 🎯 Prioritize base analysis for IRAC: prefer case-analysis or direct-analysis
        if (analyses && analyses.length > 1) {
          const iracPreferred = analyses.filter(a =>
            a.analysis_type === 'case-analysis' || a.analysis_type === 'direct-analysis'
          );
          if (iracPreferred.length > 0) {
            console.log(`📋 Preferring ${iracPreferred[0].analysis_type} as base for IRAC`);
            analyses = [iracPreferred[0]];
          } else {
            analyses = [analyses[0]]; // most recent
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
          .in("validation_status", ["validated", "pending_review", "pending"])  // Include validated, pending review, and pending
          .neq("analysis_type", "3-agent-coordination")
          // Allow case-analysis from coordinator but exclude deprecated coordinator-research
          .order("created_at", { ascending: false });

        if (clientError) {
          throw new Error(`Failed to fetch client-level analysis: ${clientError.message}`);
        }

        analyses = clientAnalyses;
        console.log(`Found ${analyses?.length || 0} client-level analysis records`);
        
        // 🎯 Prioritize base analysis for IRAC at client-level: prefer case-analysis or direct-analysis
        if (analyses && analyses.length > 1) {
          const iracPreferred = analyses.filter(a =>
            a.analysis_type === 'case-analysis' || a.analysis_type === 'direct-analysis'
          );
          if (iracPreferred.length > 0) {
            console.log(`📋 Preferring ${iracPreferred[0].analysis_type} as base for IRAC (client-level)`);
            analyses = [iracPreferred[0]];
          } else {
            analyses = [analyses[0]]; // most recent
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
        const sections = extractAnalysisSections(analysis.content || "");
        
        // Extract strengths and weaknesses using the utility function
        console.log("🔍 Extracting strengths and weaknesses from content...");
        const strengthsWeaknesses = extractStrengthsWeaknesses(analysis.content || "", analysis.case_type);
        console.log("📊 Extracted strengths:", strengthsWeaknesses.strengths.length, "weaknesses:", strengthsWeaknesses.weaknesses.length);

        // Add IRAC-based fallbacks for missing sections
        let finalPreliminaryAnalysis = sections.preliminaryAnalysis || "";
        let finalPotentialIssues = sections.potentialIssues || "";
        
        if (!finalPreliminaryAnalysis || finalPreliminaryAnalysis === "No preliminary analysis available") {
          console.log("🔧 Preliminary Analysis missing, attempting IRAC fallback...");
          const iracAnalysis = parseIracAnalysis(analysis.content || "");
          if (iracAnalysis && iracAnalysis.legalIssues.length > 0) {
            const applicationTexts = iracAnalysis.legalIssues.map(issue => issue.application).filter(Boolean);
            const conclusionTexts = iracAnalysis.legalIssues.map(issue => issue.conclusion).filter(Boolean);
            
            if (applicationTexts.length > 0 || conclusionTexts.length > 0) {
              finalPreliminaryAnalysis = [
                ...applicationTexts.slice(0, 2), // Limit to first 2 applications for brevity
                ...conclusionTexts.slice(0, 1)   // Add one conclusion
              ].join("\n\n");
              console.log("✅ Generated preliminary analysis from IRAC sections");
            }
          }
        }
        
        if (!finalPotentialIssues || finalPotentialIssues === "No potential issues identified") {
          console.log("🔧 Potential Issues missing, attempting IRAC fallback...");
          const iracAnalysis = parseIracAnalysis(analysis.content || "");
          if (iracAnalysis && iracAnalysis.legalIssues.length > 0) {
            const issueStatements = iracAnalysis.legalIssues.map(issue => `• ${issue.issueStatement}`);
            if (issueStatements.length > 0) {
              finalPotentialIssues = issueStatements.join("\n");
              console.log("✅ Generated potential issues from IRAC issue statements");
            }
          }
        }

        // 🎯 ALWAYS try to get Case Summary and Relevant Texas Law from client-intake first for better formatting
        let relevantLaw = sections.relevantLaw || "";
        let caseSummary = sections.caseSummary || "";
        
        console.log(`Current analysis type: ${analysis.analysis_type}`);
        console.log(`Current relevantLaw length: ${relevantLaw.length}`);
        console.log(`Current caseSummary length: ${caseSummary.length}`);
        
        // If this isn't already client-intake, or if sections are missing/poor quality, try client-intake
        if (analysis.analysis_type !== 'client-intake' || !relevantLaw || !caseSummary || 
            /No relevant law analysis available\./i.test(relevantLaw) || 
            /No case summary available\./i.test(caseSummary)) {
          
          console.log("🔍 Fetching Case Summary and Relevant Texas Law from client-intake...");
          try {
            let intakeData: { content: string }[] | null = null;

            // Try case-specific client-intake first when caseId is provided
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

            // Fallback: client-level client-intake (case_id IS NULL)
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
              
              // Use client-intake Case Summary if available and better
              if (intakeSections.caseSummary && !/No case summary/i.test(intakeSections.caseSummary)) {
                caseSummary = intakeSections.caseSummary;
                console.log("✅ Using Case Summary from client-intake");
              }
              
              // Use client-intake Relevant Texas Law if available and better
              if (intakeSections.relevantLaw && !/No relevant law/i.test(intakeSections.relevantLaw)) {
                relevantLaw = intakeSections.relevantLaw;
                console.log("✅ Using Relevant Texas Law from client-intake");
              }
            }
          } catch (e) {
            console.warn("Client-intake lookup for Case Summary/Relevant Texas Law failed:", e);
          }
        }

        const transformedData: AnalysisData = {
          id: analysis.id,
          legalAnalysis: {
            relevantLaw: relevantLaw,
            preliminaryAnalysis: finalPreliminaryAnalysis,
            potentialIssues: finalPotentialIssues,
            followUpQuestions: sections.followUpQuestions || []
          },
          strengths: strengthsWeaknesses.strengths,
          weaknesses: strengthsWeaknesses.weaknesses,
          conversationSummary: caseSummary, // Use the Case Summary we extracted
          outcome: {
            defense: 65,
            prosecution: 35
          },
          timestamp: analysis.timestamp || analysis.created_at || new Date().toISOString(),
          lawReferences: lawReferences,
          caseType: analysis.case_type || "general",
          remedies: sections.remedies || "",
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
