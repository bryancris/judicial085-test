
import { useState, useCallback, useRef } from 'react';

export const useDocumentPagination = () => {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isMounted = useRef(true);
  
  // Set up cleanup function to prevent state updates after unmount
  const loadMore = useCallback((fetchDocuments: (page: number) => Promise<{ hasMore: boolean }>) => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setIsLoadingMore(true);
      
      fetchDocuments(nextPage)
        .then(({ hasMore: moreAvailable }) => {
          if (isMounted.current) {
            setHasMore(moreAvailable);
          }
        })
        .catch(error => {
          console.error("Error loading more documents:", error);
        })
        .finally(() => {
          if (isMounted.current) {
            setIsLoadingMore(false);
          }
        });
      
      // Update page after starting the fetch
      setPage(nextPage);
    }
  }, [hasMore, isLoadingMore, page]);

  const resetPagination = useCallback(() => {
    if (isMounted.current) {
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
