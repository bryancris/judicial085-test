
import { useEffect } from "react";
import { useAnalysisData } from "./useAnalysisData";
import { useConversationData } from "./useConversationData";
import { useNotesData } from "./useNotesData";
import { useDocumentsData } from "./useDocumentsData";
import { useUnincorporatedFindings } from "./useUnincorporatedFindings";
import { useScholarlyReferencesData } from "./useScholarlyReferencesData";
import { useSimilarCasesData } from "./useSimilarCasesData";

export const useCaseAnalysisData = (clientId: string, caseId?: string) => {
  // Core analysis data
  const {
    analysisData,
    isAnalysisLoading,
    analysisError,
    fetchAnalysisData
  } = useAnalysisData(clientId, caseId);

  // Scholarly references
  const {
    scholarlyReferences,
    isScholarlyReferencesLoading,
    fetchScholarlyReferences,
    handleScholarSearch
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

  // Auto-fetch scholarly references when analysis data is available
  useEffect(() => {
    if (analysisData?.caseType) {
      fetchScholarlyReferences(analysisData.caseType);
    }
  }, [analysisData?.caseType, fetchScholarlyReferences]);

  // Auto-load similar cases when analysis data is available
  useEffect(() => {
    if (analysisData?.id) {
      console.log("Analysis data available, loading similar cases for analysis:", analysisData.id);
      loadSimilarCasesFromDb(analysisData.id);
    }
  }, [analysisData?.id, loadSimilarCasesFromDb]);

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
    if (analysisData?.id) {
      fetchSimilarCases(analysisData.id);
    } else {
      fetchSimilarCases();
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
