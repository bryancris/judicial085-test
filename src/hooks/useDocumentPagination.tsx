
import { useState, useCallback, useRef } from 'react';

export const useDocumentPagination = () => {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);
  
  // Fix the loadMore function to properly handle the page state
  const loadMore = useCallback(async (fetchDocuments: (page: number) => Promise<{ hasMore: boolean }>) => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      console.log(`Pagination: Loading page ${nextPage}, current state:`, { page, hasMore, isLoadingMore });
      
      try {
        if (isMounted.current) {
          setIsLoadingMore(true);
        }
        
        // Call fetchDocuments with the next page number
        const { hasMore: moreAvailable } = await fetchDocuments(nextPage);
        
        if (isMounted.current) {
          // Important: Update the page state ONLY after successful fetch
          setPage(nextPage);
          setHasMore(moreAvailable);
          console.log(`Pagination: Page updated to ${nextPage}, more available: ${moreAvailable}`);
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
    } else {
      console.log("Pagination: Can't load more", { hasMore, isLoadingMore });
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
