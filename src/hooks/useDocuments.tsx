
import { useEffect, useRef, useState } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

export const useDocuments = () => {
  // Reduced page size for better performance
  const pageSize = 4;
  const effectRan = useRef(false);
  const initialFetchDone = useRef(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  
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
  
  // Fix race condition with authentication and document loading
  useEffect(() => {
    console.log(`Auth state changed: session=${!!session}, authLoading=${authLoading}`);
    
    // Only need to prevent double fetching in React 18's StrictMode during development
    if (effectRan.current === true && initialFetchDone.current) {
      console.log("Effect already ran and initial fetch done, skipping");
      return;
    }
    
    const performInitialFetch = async () => {
      // Only proceed if we have a session and auth loading is complete
      if (session && !authLoading) {
        console.log("Session available and auth loading complete, attempting fetch");
        try {
          console.log("Performing initial fetch with page 0");
          await fetchDocuments(0, true);
          initialFetchDone.current = true;
          setInitialFetchAttempted(true);
          console.log("Initial fetch completed");
          
          // Set authLoading to false once we've initialized document fetching
          if (authLoading) {
            console.log("Setting auth loading to false after successful fetch");
            setLoading(false);
          }
        } catch (error) {
          console.error("Error during initial fetch:", error);
          setInitialFetchAttempted(true);
          if (authLoading) {
            setLoading(false);
          }
        }
      } else if (!session && !authLoading) {
        // No session but auth is not loading, we can mark fetch attempted
        console.log("No session and auth loading complete");
        setInitialFetchAttempted(true);
      }
    };
    
    performInitialFetch();
    effectRan.current = true;
    
    // Cleanup function
    return () => {
      console.log("Cleaning up document hooks...");
      fetchMounted.current = false;
      paginationMounted.current = false;
    };
  }, [session, authLoading, fetchDocuments, setLoading, fetchMounted, paginationMounted]);
  
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

  console.log("useDocuments render state:", {
    hasSession: !!session, 
    loading: authLoading || fetchLoading,
    documentsCount: documents.length,
    filteredCount: filteredDocuments.length,
    hasMore,
    initialFetchAttempted
  });

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
    hasError,
    initialFetchAttempted
  };
};
