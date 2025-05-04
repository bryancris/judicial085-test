
import { useEffect } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

export const useDocuments = () => {
  const pageSize = 6; // Number of documents per page
  
  // Use smaller, specialized hooks
  const { session, loading: authLoading, setLoading } = useDocumentAuth();
  const { 
    documents, 
    loading: fetchLoading, 
    hasError, 
    fetchDocuments
  } = useDocumentFetching(pageSize);
  
  const { 
    page,
    hasMore, 
    isLoadingMore, 
    loadMore: paginationLoadMore, 
    resetPagination 
  } = useDocumentPagination();
  
  // Use a separate effect to fetch documents after authentication is complete
  useEffect(() => {
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
  }, [session, fetchLoading, authLoading, documents.length, page, fetchDocuments, setLoading]);
  
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
