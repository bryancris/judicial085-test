
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
    fetchDocuments: fetchDocumentsBase
  } = useDocumentFetching(pageSize);
  
  const { 
    page,
    hasMore, 
    isLoadingMore, 
    loadMore: paginationLoadMore, 
    resetPagination 
  } = useDocumentPagination();
  
  // Wrapper for fetchDocuments to maintain compatibility and integrate with pagination
  const fetchDocuments = async (pageIndex: number, resetResults: boolean = false) => {
    const result = await fetchDocumentsBase(pageIndex, resetResults);
    return result;
  };
  
  // Initialize documents if session exists
  if (session && authLoading && !fetchLoading) {
    fetchDocuments(0, true);
    setLoading(false);
  }
  
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
