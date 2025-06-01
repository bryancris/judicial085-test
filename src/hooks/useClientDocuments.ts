
import { useEffect } from 'react';
import { useDocumentFetcher } from './documents/useDocumentFetcher';
import { useDocumentProcessor } from './documents/useDocumentProcessor';
import { useDocumentManager } from './documents/useDocumentManager';

export const useClientDocuments = (
  clientId: string | undefined, 
  pageSize: number = 5,
  scope: "client-level" | string = "client-level"
) => {
  const {
    documents,
    setDocuments,
    loading,
    hasError,
    hasMore,
    loadMore,
    refreshDocuments,
    isMounted
  } = useDocumentFetcher(clientId, pageSize, scope);

  const { isProcessing, processDocument } = useDocumentProcessor(
    clientId,
    scope,
    () => refreshDocuments(true)
  );

  const { toggleDocumentAnalysis, deleteDocument } = useDocumentManager(
    clientId,
    documents,
    setDocuments
  );

  // Initial fetch and cleanup
  useEffect(() => {
    isMounted.current = true;
    
    if (clientId) {
      refreshDocuments(true);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [clientId, scope, refreshDocuments]);

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
    refreshDocuments
  };
};
