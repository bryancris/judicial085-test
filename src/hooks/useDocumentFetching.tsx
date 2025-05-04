
import { useState, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent, DocumentMetadata, DocumentMetadataDetail } from '@/types/knowledge';

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
      
      // Calculate offset for pagination (Increasing page size for better performance)
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
        
        // If no metadata is found but we're on the first page, try to fetch from documents table directly
        if (pageIndex === 0) {
          console.log("Attempting to fetch documents directly from documents table");
          const { data: directDocuments, error: directError } = await supabase
            .from('documents')
            .select('id, content, metadata')
            .limit(pageSize);
            
          if (directError) {
            console.error("Direct documents fetch error:", directError);
            if (isMounted.current) {
              setHasError(true);
              setLoading(false);
            }
            return { hasMore: false };
          }
          
          if (directDocuments && directDocuments.length > 0) {
            console.log(`Found ${directDocuments.length} documents directly in documents table`);
            
            // Transform documents data to match our expected format
            const transformedDocs: DocumentWithContent[] = directDocuments.map(doc => {
              // Use type assertion to access metadata properties safely
              const metadata = doc.metadata as DocumentMetadataDetail;
              
              // Extract title from metadata if available
              const title = metadata?.file_title || 
                           metadata?.title || 
                           (metadata?.file_id ? `Document ${metadata.file_id}` : `Document ${doc.id}`);
                           
              return {
                id: metadata?.file_id || `doc-${doc.id}`,
                title: title,
                url: metadata?.file_path || null,
                created_at: metadata?.created_at || new Date().toISOString(),
                schema: null,
                contents: [{
                  id: doc.id,
                  content: doc.content,
                  metadata: doc.metadata
                }]
              };
            });
            
            if (isMounted.current) {
              setDocuments(transformedDocs);
              setLoading(false);
            }
            
            return { hasMore: directDocuments.length === pageSize };
          }
        }
        
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

      // We'll load content for more documents (increase from 4 to 6)
      const maxDocsToFetchContent = 6; 
      const docsToFetchContent = documentsWithStubs.slice(0, maxDocsToFetchContent);
      
      console.log(`Fetching content for ${docsToFetchContent.length} documents out of ${documentsWithStubs.length}`);
      
      // Use Promise.allSettled to handle individual content fetch failures
      const contentPromises = docsToFetchContent.map(async (docStub) => {
        try {
          console.log(`Fetching content for document ${docStub.id}`);
          
          // Try multiple query approaches to find content
          let documentData = null;
          let documentError = null;
          
          // Try different approaches to query the documents
          const attemptQueries = async () => {
            // First attempt: Using double arrow operator for text extraction
            const { data: data1, error: error1 } = await supabase
              .from('documents')
              .select('*')
              .eq('metadata->>file_id', docStub.id)
              .limit(10);
            
            if (!error1 && data1 && data1.length > 0) {
              console.log(`Query 1 succeeded for ${docStub.id}, found ${data1.length} items`);
              return { data: data1, error: null };
            }
            
            console.log(`Query 1 failed or returned no results for ${docStub.id}, trying next approach`);
            
            // Second attempt: Using filter with contains
            const { data: data2, error: error2 } = await supabase
              .from('documents')
              .select('*')
              .filter('metadata', 'contains', { file_id: docStub.id })
              .limit(10);
              
            if (!error2 && data2 && data2.length > 0) {
              console.log(`Query 2 succeeded for ${docStub.id}, found ${data2.length} items`);
              return { data: data2, error: null };
            }
            
            console.log(`Query 2 failed or returned no results for ${docStub.id}, trying next approach`);
            
            // Third attempt: Using like operator
            const { data: data3, error: error3 } = await supabase
              .from('documents')
              .select('*')
              .like('content', `%${docStub.id}%`)
              .limit(10);
              
            if (!error3 && data3 && data3.length > 0) {
              console.log(`Query 3 succeeded for ${docStub.id}, found ${data3.length} items`);
              return { data: data3, error: null };
            }
            
            // If we get here, all attempts failed or returned no data
            if (error1) {
              return { data: null, error: error1 };
            } else if (error2) {
              return { data: null, error: error2 };
            } else if (error3) {
              return { data: null, error: error3 };
            } else {
              return { 
                data: null, 
                error: { message: "No document content found for document ID " + docStub.id } 
              };
            }
          };
          
          const result = await attemptQueries();
          documentData = result.data;
          documentError = result.error;
          
          // Log the query results
          if (documentData) {
            console.log(`Document content query results for ${docStub.id}:`, documentData.length);
          } else {
            console.log(`No document content found for ${docStub.id}`);
          }
          
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
