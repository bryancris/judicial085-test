
import { useState, useEffect, useCallback } from 'react';
import { useKnowledgeBaseDocuments } from './useKnowledgeBaseDocuments';
import { useDocumentSearch } from './useDocumentSearch';
import { useDocumentPagination } from './useDocumentPagination';
import { useDocumentAuth } from './useDocumentAuth';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

export const useDocuments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [initialFetchAttempted, setInitialFetchAttempted] = useState(false);
  const { toast } = useToast();
  
  // Authentication
  const { session } = useDocumentAuth();
  
  // Knowledge Base documents (filtered for public documents only)
  const {
    documents,
    setDocuments,
    loading,
    setLoading,
    hasError,
    fetchDocuments: fetchKnowledgeBaseDocuments,
    isMounted
  } = useKnowledgeBaseDocuments(PAGE_SIZE);
  
  // Search functionality
  const { searchResults, performSearch, clearSearchResults } = useDocumentSearch();
  
  // Pagination
  const { 
    currentPage, 
    hasMore, 
    isLoadingMore, 
    loadMore: paginationLoadMore,
    resetPagination 
  } = useDocumentPagination(fetchKnowledgeBaseDocuments);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchAttempted) {
      console.log("Starting initial Knowledge Base document fetch");
      fetchKnowledgeBaseDocuments(0, true).then(() => {
        setInitialFetchAttempted(true);
        console.log("Initial Knowledge Base document fetch completed");
      });
    }
  }, [fetchKnowledgeBaseDocuments, initialFetchAttempted]);

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      await performSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, performSearch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    clearSearchResults();
    resetPagination();
  }, [clearSearchResults, resetPagination]);

  // Delete document functionality
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      console.log(`Attempting to delete Knowledge Base document: ${documentId}`);
      
      // Call the delete function
      const { data, error } = await supabase.functions.invoke('delete-client-document', {
        body: {
          operation: 'delete',
          documentId: documentId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete document');
      }

      // Remove from local state
      if (isMounted.current) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        clearSearchResults();
      }

      toast({
        title: "Document deleted",
        description: "The document has been successfully removed from the Knowledge Base.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting Knowledge Base document:', error);
      
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [isMounted, setDocuments, clearSearchResults, toast]);

  // Load more documents
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      paginationLoadMore();
    }
  }, [isLoadingMore, hasMore, paginationLoadMore]);

  // Determine which documents to display
  const displayDocuments = searchTerm.trim() ? searchResults : documents;

  console.log("useDocuments hook state:", {
    documentsCount: documents.length,
    searchResultsCount: searchResults.length,
    displayDocumentsCount: displayDocuments.length,
    loading,
    hasError,
    searchTerm: searchTerm.trim(),
    initialFetchAttempted
  });

  return {
    session,
    loading,
    documents: displayDocuments,
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
