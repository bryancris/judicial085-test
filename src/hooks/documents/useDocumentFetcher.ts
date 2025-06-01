
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DocumentWithContent } from "@/types/knowledge";

export const useDocumentFetcher = (
  clientId: string | undefined,
  pageSize: number = 5,
  scope: "client-level" | string = "client-level"
) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentPage = useRef(0);
  const isMounted = useRef(true);

  const fetchClientDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    if (!clientId) return { hasMore: false };
    
    try {
      console.log(`Fetching client documents for client ${clientId}, scope ${scope}, page ${pageIndex}`);
      
      if (resetResults && isMounted.current) {
        setLoading(true);
        currentPage.current = 0;
      }
      
      if (isMounted.current) {
        setHasError(false);
      }
      
      // Calculate pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      // Build query based on scope
      let query = supabase
        .from('document_metadata')
        .select('*')
        .eq('client_id', clientId);
      
      // Apply scope filtering
      if (scope === "client-level") {
        query = query.is('case_id', null);
      } else if (scope !== "all") {
        // Specific case ID
        query = query.eq('case_id', scope);
      }
      // For "all" scope, we don't add any case_id filter
      
      const { data: metadataData, error: metadataError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (metadataError) {
        console.error("Error fetching client document metadata:", metadataError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Determine if there are more records to fetch
      const hasMore = metadataData && metadataData.length === pageSize;
      setHasMore(hasMore);
      
      if (!metadataData || metadataData.length === 0) {
        console.log("No document metadata found for this client and scope");
        
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Create document stubs with metadata
      const documentStubs: DocumentWithContent[] = metadataData.map((metadata) => ({
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

      // Fetch content chunks for documents
      for (const docStub of documentStubs) {
        try {
          // Fetch document chunks for this document
          let chunkQuery = supabase
            .from('document_chunks')
            .select('*')
            .eq('document_id', docStub.id)
            .eq('client_id', clientId);
            
          // Apply case filtering for chunks too
          if (scope === "client-level") {
            chunkQuery = chunkQuery.is('case_id', null);
          } else if (scope !== "all") {
            chunkQuery = chunkQuery.eq('case_id', scope);
          }
          
          const { data: chunkData, error: chunkError } = await chunkQuery
            .order('chunk_index', { ascending: true });
            
          if (chunkError) {
            console.error(`Error fetching chunks for document ${docStub.id}:`, chunkError);
            continue;
          }
          
          if (chunkData && chunkData.length > 0) {
            console.log(`Found ${chunkData.length} chunks for document ${docStub.id}`);
            
            // Convert chunks to document contents format
            const contentItems = chunkData.map(chunk => ({
              id: Number(chunk.chunk_index),
              content: chunk.content,
              metadata: chunk.metadata
            }));
            
            // Update this document with its content
            if (isMounted.current) {
              setDocuments(prev => {
                return prev.map(doc => {
                  if (doc.id === docStub.id) {
                    return { ...doc, contents: contentItems };
                  }
                  return doc;
                });
              });
            }
          }
        } catch (err) {
          console.error(`Error processing chunks for document ${docStub.id}:`, err);
        }
      }

      if (isMounted.current) {
        setLoading(false);
      }
      
      // Return the hasMore status
      return { hasMore };
    } catch (error) {
      console.error('Error in fetchClientDocuments:', error);
      if (isMounted.current) {
        setHasError(true);
        setLoading(false);
      }
      return { hasMore: false };
    }
  }, [clientId, scope, pageSize]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      currentPage.current += 1;
      await fetchClientDocuments(currentPage.current);
    }
  }, [hasMore, loading, fetchClientDocuments]);

  const refreshDocuments = useCallback((reset: boolean = true) => {
    return fetchClientDocuments(reset ? 0 : currentPage.current, reset);
  }, [fetchClientDocuments]);

  return {
    documents,
    setDocuments,
    loading,
    hasError,
    hasMore,
    loadMore,
    refreshDocuments,
    isMounted
  };
};
