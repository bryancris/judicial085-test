
import { useEffect, useState } from "react";
import { useAnalysisData } from "./useAnalysisData";
import { useConversationData } from "./useConversationData";
import { useNotesData } from "./useNotesData";
import { useDocumentsData } from "./useDocumentsData";
import { useUnincorporatedFindings } from "./useUnincorporatedFindings";
import { useScholarlyReferencesData } from "./useScholarlyReferencesData";
import { useSimilarCasesData } from "./useSimilarCasesData";

export const useCaseAnalysisData = (clientId: string, caseId?: string) => {
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Core analysis data
  const {
    analysisData,
    isAnalysisLoading,
    analysisError,
    fetchAnalysisData
  } = useAnalysisData(clientId, caseId);

  // Scholarly references with database persistence
  const {
    scholarlyReferences,
    isScholarlyReferencesLoading,
    fetchScholarlyReferences,
    handleScholarSearch,
    loadScholarlyReferencesFromDb,
    checkScholarlyReferencesForAnalysis
  } = useScholarlyReferencesData(clientId);

  // Similar cases with database persistence
  const {
    similarCases,
    isSimilarCasesLoading,
    analysisFound,
    fallbackUsed,
    fetchSimilarCases,
    loadSimilarCasesFromDb,
    checkSimilarCasesForAnalysis
  } = useSimilarCasesData(clientId);

  // Conversation data
  const {
    conversation,
    conversationLoading,
    fetchConversation
  } = useConversationData(clientId);

  // Notes data
  const {
    notes,
    notesLoading,
    fetchNotes
  } = useNotesData(clientId);

  // Documents data
  const {
    clientDocuments,
    documentsLoading,
    isProcessingDocument,
    fetchClientDocuments,
    processDocument
  } = useDocumentsData(clientId);

  // Unincorporated findings
  const {
    hasUnincorporatedFindings,
    checkForUnincorporatedFindings
  } = useUnincorporatedFindings(clientId);

  // Track the current analysis ID when analysis data changes
  useEffect(() => {
    // We need to get the analysis ID from the database since AnalysisData doesn't have it
    const fetchAnalysisId = async () => {
      if (!clientId) return;
      
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        let query = supabase
          .from("legal_analyses")
          .select("id")
          .eq("client_id", clientId);

        if (caseId) {
          query = query.eq("case_id", caseId);
        } else {
          query = query.is("case_id", null);
        }

        const { data } = await query
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setCurrentAnalysisId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching analysis ID:", error);
      }
    };

    if (analysisData) {
      fetchAnalysisId();
    }
  }, [analysisData, clientId, caseId]);

  // UPDATED: Auto-load scholarly references from database when analysis ID is available
  useEffect(() => {
    if (currentAnalysisId && analysisData?.caseType) {
      console.log("Analysis ID available, loading scholarly references from database for analysis:", currentAnalysisId);
      
      // First try to load from database
      loadScholarlyReferencesFromDb(currentAnalysisId).then(() => {
        // Check if we actually loaded any references
        // If not, automatically fetch new ones
        setTimeout(async () => {
          try {
            const hasExisting = await checkScholarlyReferencesForAnalysis(currentAnalysisId);
            if (!hasExisting) {
              console.log("No existing scholarly references found, fetching new ones for case type:", analysisData.caseType);
              fetchScholarlyReferences(analysisData.caseType, currentAnalysisId);
            }
          } catch (error) {
            console.error("Error checking for existing scholarly references:", error);
          }
        }, 100);
      });
    }
  }, [currentAnalysisId, analysisData?.caseType, loadScholarlyReferencesFromDb, fetchScholarlyReferences, checkScholarlyReferencesForAnalysis]);

  // Auto-load similar cases when analysis ID is available
  useEffect(() => {
    if (currentAnalysisId) {
      console.log("Analysis ID available, loading similar cases for analysis:", currentAnalysisId);
      loadSimilarCasesFromDb(currentAnalysisId);
    }
  }, [currentAnalysisId, loadSimilarCasesFromDb]);

  // Load data on mount
  useEffect(() => {
    const loadAllData = async () => {
      await fetchAnalysisData();
      fetchConversation();
      fetchNotes();
      fetchClientDocuments();
      checkForUnincorporatedFindings();
    };

    loadAllData();
  }, [fetchAnalysisData, fetchConversation, fetchNotes, fetchClientDocuments, checkForUnincorporatedFindings]);

  // Enhanced fetchSimilarCases that includes the current analysis ID
  const fetchSimilarCasesWithPersistence = () => {
    if (currentAnalysisId) {
      fetchSimilarCases(currentAnalysisId);
    } else {
      fetchSimilarCases();
    }
  };

  // Enhanced fetchScholarlyReferences that includes the current analysis ID
  const fetchScholarlyReferencesWithPersistence = () => {
    if (currentAnalysisId && analysisData?.caseType) {
      fetchScholarlyReferences(analysisData.caseType, currentAnalysisId);
    } else if (analysisData?.caseType) {
      fetchScholarlyReferences(analysisData.caseType);
    }
  };

  return {
    analysisData,
    isAnalysisLoading,
    analysisError,
    hasUnincorporatedFindings,
    fetchAnalysisData,
    scholarlyReferences,
    isScholarlyReferencesLoading,
    handleScholarSearch,
    fetchScholarlyReferences: fetchScholarlyReferencesWithPersistence,
    similarCases,
    isSimilarCasesLoading,
    analysisFound,
    fallbackUsed,
    fetchSimilarCases: fetchSimilarCasesWithPersistence,
    conversation,
    notes,
    conversationLoading,
    notesLoading,
    clientDocuments,
    documentsLoading,
    processDocument,
    isProcessingDocument
  };
};
