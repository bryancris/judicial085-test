
import { useEffect, useRef, useState } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

export const useDocuments = () => {
  const pageSize = 6; // Increase page size for better initial load
  const initialFetchDone = useRef(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  
  // Use smaller, specialized hooks
  const { session, loading: authLoading } = useDocumentAuth();
  
  const { 
    documents, 
    loading: fetchLoading, 
    setLoading: setFetchLoading,
    hasError, 
    fetchDocuments,
    isMounted: fetchMounted
  } = useDocumentFetching(pageSize);
  
  const { 
    hasMore, 
    isLoadingMore, 
    loadMore: paginationLoadMore, 
    resetPagination,
    isMounted: paginationMounted
  } = useDocumentPagination();
  
  // Perform initial fetch
  useEffect(() => {
    const performInitialFetch = async () => {
      if (!initialFetchDone.current) {
        console.log("Performing initial document fetch");
        try {
          initialFetchDone.current = true;
          setFetchLoading(true);
          await fetchDocuments(0, true);
        } catch (error) {
          console.error("Error during initial fetch:", error);
        } finally {
          setInitialFetchAttempted(true);
          setFetchLoading(false);
        }
      }
    };
    
    performInitialFetch();
    
    return () => {
      console.log("Cleaning up document hooks");
      fetchMounted.current = false;
      paginationMounted.current = false;
    };
  }, [fetchDocuments, setFetchLoading]);
  
  // Document search functionality
  const { 
    searchTerm, 
    setSearchTerm, 
    isSearching, 
    handleSearch, 
    clearSearch, 
    filteredDocuments,
    isMounted: searchMounted
  } = useDocumentSearch(documents, fetchDocuments);
  
  // Load more documents - fixed implementation
  const loadMore = async () => {
    console.log("loadMore called in useDocuments", hasMore, isLoadingMore);
    if (hasMore && !isLoadingMore) {
      // Pass the fetchDocuments function directly with correct page handling
      await paginationLoadMore((page) => fetchDocuments(page, false));
    }
  };

  const loading = authLoading || fetchLoading;

  return {
    session,
    loading,
    documents: filteredDocuments,
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearch,
    clearSearch,
    loadMore,
    hasMore,
    isLoadingMore,
    hasError,
    initialFetchAttempted
  };
};
