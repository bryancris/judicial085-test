
import { useEffect } from 'react';
import { useCaseDocumentFetcher } from './documents/useCaseDocumentFetcher';
import { useCaseDocumentProcessor } from './documents/useCaseDocumentProcessor';
import { useCaseDocumentManager } from './documents/useCaseDocumentManager';
import { useCaseDocumentSearch } from './documents/useCaseDocumentSearch';

export const useCaseDocuments = (clientId: string | undefined, caseId: string | undefined, pageSize: number = 5) => {
  const {
    documents,
    setDocuments,
    loading,
    hasError,
    hasMore,
    loadMore,
    refreshDocuments,
    isMounted
  } = useCaseDocumentFetcher(clientId, caseId, pageSize);

  const { isProcessing, processDocument } = useCaseDocumentProcessor(
    clientId,
    caseId,
    () => refreshDocuments(true)
  );

  const { deleteDocument, toggleDocumentAnalysis } = useCaseDocumentManager(
    clientId,
    caseId,
    documents,
    setDocuments
  );

  const { searchDocumentsBySimilarity } = useCaseDocumentSearch(clientId, caseId);

  useEffect(() => {
    isMounted.current = true;
    
    if (clientId && caseId) {
      refreshDocuments(true);
    } else {
      setDocuments([]);
      // Don't set loading to false here as it will be handled by the fetcher
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [clientId, caseId, refreshDocuments]);

  return {
    documents,
    loading,
    hasError,
    hasMore,
    loadMore,
    isProcessing,
    processDocument,
    deleteDocument,
    toggleDocumentAnalysis,
    searchDocumentsBySimilarity,
    refreshDocuments
  };
};
