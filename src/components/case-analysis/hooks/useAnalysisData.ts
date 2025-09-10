
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisData } from "@/hooks/useAnalysisData";
import { extractLegalCitations, mapCitationsToKnowledgeBase, generateDirectPdfUrl } from "@/utils/lawReferences/knowledgeBaseMapping";
import { cleanupDuplicateAnalyses } from "@/utils/duplicateCleanupService";
import { extractAnalysisSections, extractStrengthsWeaknesses } from "@/utils/analysisParsingUtils";
import { parseLegalIssuesAssessment } from "@/utils/legalIssuesParser";
import { LegalIssuesAssessment } from "@/types/caseAnalysis";
// ⚠️ NOTE: IRAC fallback parsing removed - IRAC only for Step 5


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
      let iracAnalysis = null;
      let legalIssuesAssessment = null;

      // If case ID is provided, ONLY look for case-specific analysis
      if (caseId) {
        console.log(`Looking for case-specific analysis for case: ${caseId}`);
        const { data: caseAnalyses, error: caseError } = await supabase
          .from("legal_analyses")
          .select("*")
          .eq("client_id", clientId)
          .eq("case_id", caseId)
          .in("validation_status", ["validated", "pending_review", "pending"])  // Include validated, pending review, and pending
          // Allow case-analysis from coordinator but exclude deprecated coordinator-research
          .order("created_at", { ascending: false });

        if (caseError) {
          throw new Error(`Failed to fetch case-specific analysis: ${caseError.message}`);
        }

        // Separate IRAC analysis and Step 6 assessment from main analysis
        iracAnalysis = caseAnalyses?.find(a => a.analysis_type === 'irac-analysis');
        legalIssuesAssessment = caseAnalyses?.find(a => a.analysis_type === 'risk-assessment');
        analyses = caseAnalyses?.filter(a => !['irac-analysis', 'risk-assessment'].includes(a.analysis_type));
        console.log(`Found ${analyses?.length || 0} case-specific analysis records, ${iracAnalysis ? 1 : 0} IRAC records`);

        // If no case-specific analysis, fall back to latest client-level analysis
        if (!analyses || analyses.length === 0) {
          console.log(`No case-specific analysis found, falling back to client-level (case_id IS NULL)`);
          const { data: clientAnalysesFallback, error: clientFallbackError } = await supabase
            .from("legal_analyses")
            .select("*")
            .eq("client_id", clientId)
            .is("case_id", null)
            .in("validation_status", ["validated", "pending_review", "pending"])  // Include validated, pending review, and pending
            // Allow case-analysis from coordinator but exclude deprecated coordinator-research
            .order("created_at", { ascending: false });

          if (clientFallbackError) {
            throw new Error(`Failed to fetch client-level analysis (fallback): ${clientFallbackError.message}`);
          }

          // Separate IRAC analysis and Step 6 assessment from main analysis for fallback too
          const fallbackIrac = clientAnalysesFallback?.find(a => a.analysis_type === 'irac-analysis');
          const fallbackAssessment = clientAnalysesFallback?.find(a => a.analysis_type === 'risk-assessment');
          if (fallbackIrac && !iracAnalysis) {
            iracAnalysis = fallbackIrac;
          }
          if (fallbackAssessment && !legalIssuesAssessment) {
            legalIssuesAssessment = fallbackAssessment;
          }
          analyses = clientAnalysesFallback?.filter(a => !['irac-analysis', 'risk-assessment'].includes(a.analysis_type));
          console.log(`Found ${analyses?.length || 0} client-level analysis records (fallback)`);
        }
        
        // Simplify: prefer most recent analysis
        if (analyses && analyses.length > 1) {
          analyses = [analyses[0]];
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
          
          // Allow case-analysis from coordinator but exclude deprecated coordinator-research
          .order("created_at", { ascending: false });

        if (clientError) {
          throw new Error(`Failed to fetch client-level analysis: ${clientError.message}`);
        }

        // Separate IRAC analysis and Step 6 assessment from main analysis
        iracAnalysis = clientAnalyses?.find(a => a.analysis_type === 'irac-analysis');
        legalIssuesAssessment = clientAnalyses?.find(a => a.analysis_type === 'risk-assessment');
        analyses = clientAnalyses?.filter(a => !['irac-analysis', 'risk-assessment'].includes(a.analysis_type));
        console.log(`Found ${analyses?.length || 0} client-level analysis records, ${iracAnalysis ? 1 : 0} IRAC records`);
        
        // Simplify: prefer most recent analysis (client-level)
        if (analyses && analyses.length > 1) {
          analyses = [analyses[0]];
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
        

        // 🎯 ALWAYS try to get Case Summary, Relevant Texas Law, and Preliminary Analysis from client-intake first for better formatting
        let relevantLaw = sections.relevantLaw || "";
        let caseSummary = sections.caseSummary || "";
        
        console.log(`Current analysis type: ${analysis.analysis_type}`);
        console.log(`Current relevantLaw length: ${relevantLaw.length}`);
        console.log(`Current caseSummary length: ${caseSummary.length}`);
        console.log(`Current preliminaryAnalysis length: ${finalPreliminaryAnalysis.length}`);
        
        // If this isn't already client-intake, or if sections are missing/poor quality, try client-intake
        if (analysis.analysis_type !== 'client-intake' || !relevantLaw || !caseSummary || 
            /No relevant law analysis available\./i.test(relevantLaw) || 
            /No case summary available\./i.test(caseSummary) ||
            !finalPreliminaryAnalysis || finalPreliminaryAnalysis === "No preliminary analysis available") {
          
          console.log("🔍 Fetching sections from client-intake...");
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
              
              // Use client-intake Preliminary Analysis only if current is missing or too short
              if (
                intakeSections.preliminaryAnalysis &&
                !/No preliminary analysis/i.test(intakeSections.preliminaryAnalysis) &&
                (
                  !finalPreliminaryAnalysis ||
                  finalPreliminaryAnalysis.trim().length < 80
                )
              ) {
                finalPreliminaryAnalysis = intakeSections.preliminaryAnalysis;
                console.log("✅ Using Preliminary Analysis from client-intake (existing was missing/short)");
              } else {
                console.log("ℹ️ Keeping existing Preliminary Analysis from primary analysis source");
              }
              
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
            console.warn("Client-intake lookup failed:", e);
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
          iracContent: iracAnalysis?.content || null,
          legalIssuesAssessment: legalIssuesAssessment ? parseLegalIssuesAssessment(legalIssuesAssessment.content) : null,
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
