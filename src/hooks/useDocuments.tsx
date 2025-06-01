
import { useEffect, useRef, useState } from 'react';
import { useDocumentAuth } from '@/hooks/useDocumentAuth';
import { useDocumentFetching } from '@/hooks/useDocumentFetching';
import { useDocumentPagination } from '@/hooks/useDocumentPagination';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDocuments = () => {
  const pageSize = 6; // Increase page size for better initial load
  const initialFetchDone = useRef(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const { toast } = useToast();
  
  // Use smaller, specialized hooks
  const { session, loading: authLoading } = useDocumentAuth();
  
  const { 
    documents, 
    setDocuments,
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
  
  // Delete document function
  const deleteDocument = async (documentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log(`Deleting document: ${documentId}`);
      
      // Delete document chunks first (due to foreign key constraints)
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('document_id', documentId);
      
      if (chunksError) {
        console.error('Error deleting document chunks:', chunksError);
        throw new Error(`Failed to delete document chunks: ${chunksError.message}`);
      }
      
      // Delete document metadata
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .delete()
        .eq('id', documentId);
      
      if (metadataError) {
        console.error('Error deleting document metadata:', metadataError);
        throw new Error(`Failed to delete document metadata: ${metadataError.message}`);
      }
      
      // Delete from documents table (legacy data)
      const { error: documentsError } = await supabase
        .from('documents')
        .delete()
        .eq('metadata->>file_id', documentId);
      
      if (documentsError) {
        console.warn('Error deleting from documents table (this might be expected):', documentsError);
        // Don't throw error here as this table might not have the document
      }
      
      // Update local state to remove the deleted document
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      console.log(`Document ${documentId} deleted successfully`);
      return { success: true };
      
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  };
  
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
  
  // Fixed loadMore function implementation that properly handles pagination
  const loadMore = async () => {
    console.log("loadMore called in useDocuments", { hasMore, isLoadingMore });
    
    if (hasMore && !isLoadingMore) {
      try {
        // Use a wrapper function to call fetchDocuments with the correct arguments
        await paginationLoadMore(async (nextPage) => {
          console.log(`useDocuments: Calling fetchDocuments with page ${nextPage}`);
          return await fetchDocuments(nextPage, false);
        });
      } catch (error) {
        console.error("Error in loadMore:", error);
      }
    } else {
      console.log("Cannot load more: ", { hasMore, isLoadingMore });
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
    initialFetchAttempted,
    deleteDocument
  };
};
