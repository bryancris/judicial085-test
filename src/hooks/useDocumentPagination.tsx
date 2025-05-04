
import { useState, useCallback, useRef } from 'react';

export const useDocumentPagination = () => {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);
  
  // Load more function with improved error handling
  const loadMore = useCallback(async (fetchDocuments: (page: number) => Promise<{ hasMore: boolean }>) => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      
      try {
        if (isMounted.current) {
          setIsLoadingMore(true);
        }
        console.log(`Loading page ${nextPage}`);
        
        const { hasMore: moreAvailable } = await fetchDocuments(nextPage);
        
        if (isMounted.current) {
          setHasMore(moreAvailable);
          // Update page after successful fetch
          setPage(nextPage);
          console.log(`Page updated to ${nextPage}, more available: ${moreAvailable}`);
        }
      } catch (error) {
        console.error("Error in loadMore:", error);
        if (isMounted.current) {
          setHasMore(false);
        }
      } finally {
        if (isMounted.current) {
          setIsLoadingMore(false);
        }
      }
    }
  }, [hasMore, isLoadingMore, page]);

  const resetPagination = useCallback(() => {
    if (isMounted.current) {
      console.log("Pagination reset");
      setPage(0);
      setHasMore(true);
      setIsLoadingMore(false);
    }
  }, []);

  return {
    page,
    setPage,
    hasMore,
    setHasMore,
    isLoadingMore,
    setIsLoadingMore,
    loadMore,
    resetPagination,
    isMounted
  };
};
