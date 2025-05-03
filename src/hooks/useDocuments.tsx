import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent, DocumentMetadata } from '@/types/knowledge';

export const useDocuments = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 6; // Number of documents per page
  const { toast } = useToast();

  // Authentication check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchDocuments(0, true);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch documents with pagination
  const fetchDocuments = async (pageIndex: number, resetResults: boolean = false) => {
    try {
      setLoading(resetResults ? true : false);
      setIsLoadingMore(!resetResults && pageIndex > 0);
      setHasError(false);
      
      // Calculate offset for pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      // First, get document metadata with pagination
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });
      
      if (metadataError) {
        throw metadataError;
      }

      if (!metadataData || metadataData.length === 0) {
        if (resetResults) {
          setDocuments([]);
        }
        setHasMore(false);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      setHasMore(metadataData.length === pageSize);
      console.log('Fetched metadata:', metadataData);

      // Create document stubs with metadata but empty content initially
      const documentsWithStubs: DocumentWithContent[] = metadataData.map((metadata: DocumentMetadata) => ({
        ...metadata,
        contents: []
      }));

      // If we're resetting results, replace the documents array
      // Otherwise append to existing documents
      if (resetResults) {
        setDocuments(documentsWithStubs);
      } else {
        setDocuments(prev => [...prev, ...documentsWithStubs]);
      }

      // Then fetch document content for each document separately
      // This prevents one large query that might timeout
      const updatedDocuments = await Promise.all(
        documentsWithStubs.map(async (docStub) => {
          try {
            console.log(`Fetching content for document ${docStub.id}`);
            
            // Set a reasonable limit to avoid timeouts
            const { data: documentData, error: documentError } = await supabase
              .from('documents')
              .select('*')
              .filter('metadata->>file_id', 'eq', docStub.id)
              .limit(20); // Limit to prevent timeout
            
            if (documentError) {
              console.error(`Error fetching content for document ${docStub.id}:`, documentError);
              // Continue with empty contents instead of failing the whole request
              return {
                ...docStub,
                contents: [],
                fetchError: documentError.message
              };
            }
            
            console.log(`Content for document ${docStub.id}:`, documentData ? documentData.length : 0, 'segments');
            
            return {
              ...docStub,
              contents: documentData || [],
              fetchError: null
            };
          } catch (err) {
            console.error(`Error processing document ${docStub.id}:`, err);
            return {
              ...docStub,
              contents: [],
              fetchError: err instanceof Error ? err.message : 'Unknown error'
            };
          }
        })
      );

      // Update the documents state with the fetched content
      setDocuments(prev => {
        if (resetResults) {
          return updatedDocuments;
        } else {
          // Replace the stub documents with the updated ones, keeping any existing docs
          const existingDocs = prev.filter(doc => 
            !updatedDocuments.some(updatedDoc => updatedDoc.id === doc.id)
          );
          return [...existingDocs, ...updatedDocuments];
        }
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      setHasError(true);
      toast({
        title: "Error fetching documents",
        description: "Could not retrieve document information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more documents
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDocuments(nextPage);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Reset pagination when searching
    setPage(0);
    setHasMore(true);
    
    // For now, we'll just implement client-side filtering
    // In a production app, you would want to implement server-side search
    setIsSearching(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    // Reset pagination when clearing search
    setPage(0);
    setHasMore(true);
    fetchDocuments(0, true);
  };

  // Filter documents based on search term
  const filteredDocuments = searchTerm ? documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.metadata?.file_title && 
       content.metadata.file_title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  ) : documents;

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
    hasError
  };
};
