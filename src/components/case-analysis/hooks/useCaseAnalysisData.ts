
import { useScholarlyReferences } from "@/hooks/useScholarlyReferences";
import { useCaseAnalysisChat } from "@/hooks/useCaseAnalysisChat";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { useAnalysisData } from "@/hooks/useAnalysisData";

export const useCaseAnalysisData = (clientId: string, caseId?: string) => {
  // Use the database-backed analysis hook
  const {
    analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError,
    fetchAnalysisData
  } = useAnalysisData(clientId, caseId);

  // Add scholarly references hook
  const {
    references: scholarlyReferences,
    isLoading: isScholarlyReferencesLoading,
    searchReferences
  } = useScholarlyReferences(clientId, "general");
  
  // Get conversation and notes for the respective tabs
  const {
    conversation,
    notes, 
    loading: conversationLoading,
    isLoading: notesLoading
  } = useCaseAnalysisChat(clientId);

  // Client documents hook
  const {
    documents: clientDocuments,
    loading: documentsLoading,
    processDocument: processDocumentContent,
    isProcessing: isProcessingDocument
  } = useClientDocuments(clientId);

  // Create a wrapper function to adapt processDocumentContent to expect a File
  const processDocument = async (title: string, content: string, metadata: any = {}): Promise<any> => {
    try {
      return await processDocumentContent(title, content, metadata);
    } catch (error) {
      console.error("Error processing document content:", error);
    }
  };

  // Handle the search for scholarly references
  const handleScholarSearch = (query: string) => {
    if (query) {
      searchReferences(query);
    }
  };

  return {
    analysisData,
    isAnalysisLoading,
    analysisError,
    fetchAnalysisData,
    scholarlyReferences,
    isScholarlyReferencesLoading,
    handleScholarSearch,
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
