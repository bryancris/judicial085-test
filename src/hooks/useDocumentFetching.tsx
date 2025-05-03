import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent, DocumentMetadata } from '@/types/knowledge';

export const useDocumentFetching = (pageSize: number) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async (pageIndex: number, resetResults: boolean = false) => {
    try {
      setLoading(resetResults ? true : false);
      setHasError(false);
      
      // Calculate offset for pagination
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      // First, get document metadata with pagination, now sorted by title
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .order('title', { ascending: true }) // Sort alphabetically by title
        .range(from, to);
      
      if (metadataError) {
        throw metadataError;
      }

      if (!metadataData || metadataData.length === 0) {
        if (resetResults) {
          setDocuments([]);
        }
        setLoading(false);
        return { hasMore: false };
      }

      const hasMore = metadataData.length === pageSize;
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

      return { hasMore };
    } catch (error) {
      console.error('Error fetching documents:', error);
      setHasError(true);
      toast({
        title: "Error fetching documents",
        description: "Could not retrieve document information",
        variant: "destructive",
      });
      return { hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    setDocuments,
    loading,
    setLoading,
    hasError,
    fetchDocuments
  };
};
