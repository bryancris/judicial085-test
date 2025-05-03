
import { useState } from 'react';

export const useDocumentPagination = () => {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const loadMore = (fetchDocuments: (page: number) => Promise<{ hasMore: boolean }>) => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setIsLoadingMore(true);
      
      fetchDocuments(nextPage)
        .then(({ hasMore: moreAvailable }) => {
          setHasMore(moreAvailable);
        })
        .finally(() => {
          setIsLoadingMore(false);
        });
    }
  };

  const resetPagination = () => {
    setPage(0);
    setHasMore(true);
  };

  return {
    page,
    setPage,
    hasMore,
    setHasMore,
    isLoadingMore,
    setIsLoadingMore,
    loadMore,
    resetPagination
  };
};
