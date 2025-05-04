
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
      console.log(`Fetching documents, page ${pageIndex}, reset: ${resetResults}`);
      
      if (resetResults && isMounted.current) {
        setLoading(true);
      }
      
      if (isMounted.current) {
        setHasError(false);
      }
      
      // Calculate pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching document metadata from ${from} to ${to}`);
      
      // First, get document metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .order('title', { ascending: true })
        .range(from, to);
      
      if (metadataError) {
        console.error("Error fetching document metadata:", metadataError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
        }
        return { hasMore: false };
      }

      console.log(`Received ${metadataData?.length || 0} metadata records`);
      
      // Determine if there are more records to fetch
      const hasMore = metadataData && metadataData.length === pageSize;
      console.log(`Has more documents: ${hasMore}`);
      
      if (!metadataData || metadataData.length === 0) {
        console.log("No document metadata found");
        
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Create document stubs with metadata
      const documentStubs: DocumentWithContent[] = metadataData.map((metadata: DocumentMetadata) => ({
        ...metadata,
        contents: []
      }));

      // Update state with stubs first for quick display
      if (resetResults && isMounted.current) {
        setDocuments(documentStubs);
      } else if (isMounted.current) {
        // Make sure we don't add duplicates
        setDocuments(prev => {
          const existingIds = new Set(prev.map(doc => doc.id));
          const newDocs = documentStubs.filter(doc => !existingIds.has(doc.id));
          return [...prev, ...newDocs];
        });
      }

      // Fetch content for documents (limit to avoid performance issues)
      const docsToFetchContent = documentStubs.slice(0, Math.min(documentStubs.length, 6));
      
      for (const docStub of docsToFetchContent) {
        try {
          // Fetch content for this document
          const { data: contentData, error: contentError } = await supabase
            .from('documents')
            .select('*')
            .eq('metadata->>file_id', docStub.id)
            .limit(10);
            
          if (contentError) {
            console.error(`Error fetching content for document ${docStub.id}:`, contentError);
            continue;
          }
          
          if (contentData && contentData.length > 0) {
            console.log(`Found ${contentData.length} content items for document ${docStub.id}`);
            
            // Update this document with its content
            if (isMounted.current) {
              setDocuments(prev => {
                return prev.map(doc => {
                  if (doc.id === docStub.id) {
                    return { ...doc, contents: contentData };
                  }
                  return doc;
                });
              });
            }
          }
        } catch (err) {
          console.error(`Error processing content for document ${docStub.id}:`, err);
        }
      }

      if (isMounted.current) {
        setLoading(false);
      }
      
      // Critical: Return the hasMore status
      return { hasMore };
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      if (isMounted.current) {
        setHasError(true);
        setLoading(false);
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
