
import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentWithContent } from "@/types/knowledge";
import { useDocumentFetching } from "./useDocumentFetching";
import { useDocumentProcessing } from "./useDocumentProcessing";
import { useDocumentDeletion } from "./useDocumentDeletion";

export const useClientDocuments = (
  clientId: string | undefined, 
  pageSize: number = 5,
  scope: "client-level" | string = "client-level"
) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentPage = useRef(0);
  const isMounted = useRef(true);

  // Use the specialized hooks
  const { fetchClientDocuments } = useDocumentFetching(clientId, scope, pageSize);

  // Refresh documents function
  const refreshDocuments = useCallback(async (reset: boolean = true) => {
    const pageIndex = reset ? 0 : currentPage.current;
    
    try {
      if (reset && isMounted.current) {
        setLoading(true);
        currentPage.current = 0;
      }
      
      if (isMounted.current) {
        setHasError(false);
      }

      const result = await fetchClientDocuments(pageIndex, reset);
      
      if (reset && isMounted.current) {
        setDocuments(result.documents);
      } else if (isMounted.current) {
        // Make sure we don't add duplicates
        setDocuments(prev => {
          const existingIds = new Set(prev.map(doc => doc.id));
          const newDocs = result.documents.filter(doc => !existingIds.has(doc.id));
          return [...prev, ...newDocs];
        });
      }

      if (isMounted.current) {
        setHasMore(result.hasMore);
        setLoading(false);
      }

    } catch (error) {
      console.error('Error refreshing documents:', error);
      if (isMounted.current) {
        setHasError(true);
        setLoading(false);
      }
    }
  }, [fetchClientDocuments]);

  const { processDocument: processDocumentCore } = useDocumentProcessing(
    clientId, 
    scope, 
    refreshDocuments
  );

  const { deleteDocument: deleteDocumentCore } = useDocumentDeletion(
    clientId,
    refreshDocuments
  );

  // Wrapper functions with loading state management
  const processDocument = useCallback(async (
    title: string, 
    content: string, 
    metadata: any = {},
    file?: File
  ) => {
    setIsProcessing(true);
    try {
      return await processDocumentCore(title, content, metadata, file);
    } finally {
      setIsProcessing(false);
    }
  }, [processDocumentCore]);

  const deleteDocument = useCallback(async (documentId: string) => {
    setIsProcessing(true);
    
    try {
      // Update UI state optimistically
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      const result = await deleteDocumentCore(documentId);
      
      if (!result.success) {
        // Restore document in UI on error
        await refreshDocuments(true);
      }
      
      return result;
      
    } finally {
      setIsProcessing(false);
    }
  }, [deleteDocumentCore, refreshDocuments]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    
    if (clientId) {
      refreshDocuments(true);
    } else {
      setDocuments([]);
      setLoading(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [clientId, scope, refreshDocuments]);

  // Load more documents
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      currentPage.current += 1;
      await refreshDocuments(false);
    }
  }, [hasMore, loading, refreshDocuments]);

  return {
    documents,
    loading,
    hasError,
    hasMore,
    loadMore,
    isProcessing,
    processDocument,
    deleteDocument,
    refreshDocuments
  };
};
