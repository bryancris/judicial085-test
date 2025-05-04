
import { useEffect, useRef, useState } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

export const useDocuments = () => {
  // Reduced page size for better performance
  const pageSize = 4;
  const initialFetchDone = useRef(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  
  // Use smaller, specialized hooks
  const { session, loading: authLoading, setLoading: setAuthLoading } = useDocumentAuth();
  
  const { 
    documents, 
    loading: fetchLoading, 
    setLoading: setFetchLoading,
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
  
  // Fix race condition with authentication and document loading
  useEffect(() => {
    console.log(`Auth state changed: session=${!!session}, authLoading=${authLoading}`);
    
    const performInitialFetch = async () => {
      // Only proceed if we have a session and auth loading is complete
      if (session && !initialFetchDone.current) {
        console.log("Session available, attempting fetch");
        try {
          console.log("Performing initial fetch with page 0");
          initialFetchDone.current = true; // Set this first to prevent multiple attempts
          setFetchLoading(true);
          await fetchDocuments(0, true);
          setInitialFetchAttempted(true);
          console.log("Initial fetch completed");
        } catch (error) {
          console.error("Error during initial fetch:", error);
          initialFetchDone.current = false; // Reset so we can try again
          setInitialFetchAttempted(true);
        } finally {
          setFetchLoading(false);
        }
      } else if (!session && !authLoading) {
        // No session but auth is not loading, we can mark fetch attempted
        console.log("No session and auth loading complete");
        setInitialFetchAttempted(true);
        setFetchLoading(false);
      }
    };
    
    performInitialFetch();
    
    // Cleanup function
    return () => {
      console.log("Cleaning up document hooks...");
      fetchMounted.current = false;
      paginationMounted.current = false;
    };
  }, [session, authLoading, fetchDocuments, setFetchLoading, fetchMounted, paginationMounted]);
  
  // Use document search functionality
  const { 
    searchTerm, 
    setSearchTerm, 
    isSearching, 
    handleSearch, 
    clearSearch, 
    filteredDocuments,
    isMounted: searchMounted
  } = useDocumentSearch(documents, fetchDocuments);
  
  // Clean up all mounted refs on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up all refs");
      fetchMounted.current = false;
      paginationMounted.current = false;
      searchMounted.current = false;
    };
  }, [fetchMounted, paginationMounted, searchMounted]);
  
  // Load more documents
  const loadMore = async () => {
    console.log("Loading more documents");
    if (hasMore && !isLoadingMore) {
      await paginationLoadMore(fetchDocuments);
    }
  };

  const loading = authLoading || fetchLoading;

  console.log("useDocuments render state:", {
    hasSession: !!session, 
    loading,
    authLoading,
    fetchLoading,
    documentsCount: documents.length,
    filteredCount: filteredDocuments.length,
    hasMore,
    initialFetchAttempted
  });

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
