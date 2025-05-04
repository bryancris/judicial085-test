
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent, DocumentMetadata } from '@/types/knowledge';

export const useDocumentFetching = (pageSize: number) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const isMounted = useRef(true);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    try {
      if (resetResults && isMounted.current) {
        setLoading(true);
      }
      if (isMounted.current) {
        setHasError(false);
      }
      
      // Calculate offset for pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching documents from ${from} to ${to}`);
      
      // First, get document metadata with pagination
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .order('title', { ascending: true }) 
        .range(from, to);
      
      if (metadataError) {
        throw metadataError;
      }

      if (!metadataData || metadataData.length === 0) {
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      const hasMore = metadataData.length === pageSize;
      console.log('Fetched metadata:', metadataData.length, 'documents');

      // Create document stubs with metadata but empty content initially
      const documentsWithStubs: DocumentWithContent[] = metadataData.map((metadata: DocumentMetadata) => ({
        ...metadata,
        contents: []
      }));

      // Update documents based on whether we're resetting or appending
      if (resetResults && isMounted.current) {
        setDocuments(documentsWithStubs);
      } else if (isMounted.current) {
        setDocuments(prev => {
          // Filter out any duplicates
          const existingIds = new Set(prev.map(doc => doc.id));
          const newDocs = documentsWithStubs.filter(doc => !existingIds.has(doc.id));
          return [...prev, ...newDocs];
        });
      }

      // Then fetch document content for each document separately
      const updatedDocuments = await Promise.all(
        documentsWithStubs.map(async (docStub) => {
          try {
            console.log(`Fetching content for document ${docStub.id}`);
            
            // Set a reasonable limit to avoid timeouts
            const { data: documentData, error: documentError } = await supabase
              .from('documents')
              .select('*')
              .filter('metadata->>file_id', 'eq', docStub.id)
              .limit(20); 
            
            if (documentError) {
              console.error(`Error fetching content for document ${docStub.id}:`, documentError);
              return {
                ...docStub,
                contents: [],
                fetchError: documentError.message
              };
            }
            
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
      if (isMounted.current) {
        setDocuments(prev => {
          if (resetResults) {
            return updatedDocuments;
          } else {
            // Create a map of existing documents not being updated
            const existingDocs = prev.filter(doc => 
              !updatedDocuments.some(updatedDoc => updatedDoc.id === doc.id)
            );
            return [...existingDocs, ...updatedDocuments];
          }
        });
      }

      return { hasMore };
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (isMounted.current) {
        setHasError(true);
        toast({
          title: "Error fetching documents",
          description: "Could not retrieve document information",
          variant: "destructive",
        });
      }
      return { hasMore: false };
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [pageSize, toast]);

  return {
    documents,
    setDocuments,
    loading,
    setLoading,
    hasError,
    fetchDocuments,
    isMounted
  };
};
