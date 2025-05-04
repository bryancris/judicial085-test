
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
      console.log(`fetchDocuments called with pageIndex=${pageIndex}, resetResults=${resetResults}`);
      
      if (resetResults && isMounted.current) {
        setLoading(true);
        console.log("Setting loading state to true for reset");
      }
      
      if (isMounted.current) {
        setHasError(false);
      }
      
      // Calculate offset for pagination (Reducing page size for better performance)
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
        console.error("Metadata fetch error:", metadataError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
          toast({
            title: "Error fetching documents",
            description: metadataError.message,
            variant: "destructive",
          });
        }
        return { hasMore: false };
      }

      console.log(`Received metadata:`, metadataData);
      
      if (!metadataData || metadataData.length === 0) {
        console.log("No metadata found or empty results");
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      const hasMore = metadataData.length === pageSize;
      console.log('Fetched metadata:', metadataData.length, 'documents, hasMore:', hasMore);

      // Create document stubs with metadata but empty content initially
      const documentsWithStubs: DocumentWithContent[] = metadataData.map((metadata: DocumentMetadata) => ({
        ...metadata,
        contents: []
      }));

      // Update documents based on whether we're resetting or appending
      if (resetResults && isMounted.current) {
        console.log("Resetting documents with new stubs", documentsWithStubs);
        setDocuments(documentsWithStubs);
      } else if (isMounted.current) {
        console.log("Appending new documents to existing ones");
        setDocuments(prev => {
          // Filter out any duplicates
          const existingIds = new Set(prev.map(doc => doc.id));
          const newDocs = documentsWithStubs.filter(doc => !existingIds.has(doc.id));
          return [...prev, ...newDocs];
        });
      }

      // We'll load content for more documents (increased from 2 to 4)
      const maxDocsToFetchContent = 4; 
      const docsToFetchContent = documentsWithStubs.slice(0, maxDocsToFetchContent);
      
      console.log(`Fetching content for ${docsToFetchContent.length} documents out of ${documentsWithStubs.length}`);
      
      // Use Promise.allSettled to handle individual content fetch failures
      const contentPromises = docsToFetchContent.map(async (docStub) => {
        try {
          console.log(`Fetching content for document ${docStub.id}`);
          
          // FIX: Use correct Supabase JSONB query syntax
          // Increase content items per document from 3 to 5
          const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .eq('metadata->>file_id', docStub.id)
            .limit(5);
          
          // Log the query results for debugging
          console.log(`Document content query results for ${docStub.id}:`, documentData);
          
          if (documentError) {
            console.error(`Error fetching content for document ${docStub.id}:`, documentError);
            return {
              ...docStub,
              contents: [],
              fetchError: documentError.message
            };
          }
          
          if (documentData) {
            console.log(`Fetched ${documentData.length} content items for document ${docStub.id}`);
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
      });
      
      const contentResults = await Promise.allSettled(contentPromises);
      const updatedDocuments = contentResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            ...docsToFetchContent[index],
            contents: [],
            fetchError: result.reason || 'Failed to fetch content'
          };
        }
      });
      
      // Create a map of documents with content + documents without content
      const remainingStubs = documentsWithStubs.slice(maxDocsToFetchContent).map(doc => ({
        ...doc,
        fetchError: "Content fetch skipped for performance"
      }));
      
      const allUpdatedDocs = [...updatedDocuments, ...remainingStubs];
      console.log(`Total updated documents: ${allUpdatedDocs.length}`);

      // Update the documents state with the fetched content
      if (isMounted.current) {
        setDocuments(prev => {
          if (resetResults) {
            return allUpdatedDocs;
          } else {
            // Create a map of existing documents not being updated
            const existingDocs = prev.filter(doc => 
              !allUpdatedDocs.some(updatedDoc => updatedDoc.id === doc.id)
            );
            return [...existingDocs, ...allUpdatedDocs];
          }
        });
      }

      if (isMounted.current) {
        setLoading(false);
      }
      
      return { hasMore };
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (isMounted.current) {
        setHasError(true);
        setLoading(false);
        toast({
          title: "Error fetching documents",
          description: "Could not retrieve document information",
          variant: "destructive",
        });
      }
      return { hasMore: false };
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
