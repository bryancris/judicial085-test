
import { useEffect, useRef } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

export const useDocuments = () => {
  const pageSize = 6; // Number of documents per page
  const effectRan = useRef(false);
  
  // Use smaller, specialized hooks
  const { session, loading: authLoading, setLoading } = useDocumentAuth();
  const { 
    documents, 
    loading: fetchLoading, 
    hasError, 
    fetchDocuments,
    isMounted: fetchMounted
  } = useDocumentFetching(pageSize);
  
  const { 
    page,
    hasMore, 
    isLoadingMore, 
    loadMore: paginationLoadMore, 
    resetPagination,
    isMounted: paginationMounted
  } = useDocumentPagination();
  
  // Use a separate effect to fetch documents after authentication is complete
  useEffect(() => {
    // This prevents double-fetching in React 18's StrictMode during development
    if (effectRan.current === false) {
      if (session && !fetchLoading) {
        // Only fetch documents if we haven't already or if we're on page 0
        if (documents.length === 0 || page === 0) {
          fetchDocuments(0, true);
        }
        // Set authLoading to false once we've initialized document fetching
        if (authLoading) {
          setLoading(false);
        }
      }
      
      effectRan.current = true;
    }
    
    // Cleanup function
    return () => {
      fetchMounted.current = false;
      paginationMounted.current = false;
    };
  }, [session, fetchLoading, authLoading, documents.length, page, fetchDocuments, setLoading, fetchMounted, paginationMounted]);
  
  const { 
    searchTerm, 
    setSearchTerm, 
    isSearching, 
    handleSearch, 
    clearSearch, 
    filteredDocuments 
  } = useDocumentSearch(documents, fetchDocuments);
  
  // Load more documents
  const loadMore = () => {
    paginationLoadMore((nextPage) => fetchDocuments(nextPage));
  };

  return {
    session,
    loading: authLoading || fetchLoading,
    documents: filteredDocuments,
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearch,
    clearSearch,
    loadMore,
    hasMore,
    isLoadingMore,
    hasError
  };
};
