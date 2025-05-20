import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent } from "@/types/knowledge";
import { extractTextFromPdf, uploadPdfToStorage, generateEmbeddings } from "@/utils/pdfUtils";

export const useClientDocuments = (clientId: string | undefined, pageSize: number = 5) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentPage = useRef(0);
  const isMounted = useRef(true);
  const { toast } = useToast();

  // Fetch client-specific documents
  const fetchClientDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    if (!clientId) return { hasMore: false };
    
    try {
      console.log(`Fetching client documents for client ${clientId}, page ${pageIndex}`);
      
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
      
      // First, get document metadata for this client
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('client_id', clientId)
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
        console.log("No document metadata found for this client");
        
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
          const { data: chunkData, error: chunkError } = await supabase
            .from('document_chunks')
            .select('*')
            .eq('document_id', docStub.id)
            .eq('client_id', clientId)
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
  }, [clientId, pageSize]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    
    if (clientId) {
      fetchClientDocuments(0, true);
    } else {
      setDocuments([]);
      setLoading(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [clientId, fetchClientDocuments]);

  // Load more documents
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      currentPage.current += 1;
      await fetchClientDocuments(currentPage.current);
    }
  }, [hasMore, loading, fetchClientDocuments]);

  // Process and chunk a document for a specific client
  const processDocument = useCallback(async (
    title: string, 
    content: string, 
    metadata: any = {}
  ) => {
    if (!clientId) {
      console.error("Cannot process document: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    setIsProcessing(true);
    
    try {
      // Generate a unique ID for the document
      const documentId = crypto.randomUUID();
      
      // Insert document metadata
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title,
          client_id: clientId,
          schema: 'client_document',
          url: metadata.pdfUrl || null
        });
      
      if (metadataError) {
        throw new Error(`Error creating document metadata: ${metadataError.message}`);
      }
      
      // Check if this is a PDF document with embeddings already generated
      if (metadata.isPdfDocument) {
        // Embeddings already generated by the upload process
        // Refresh the document list
        await fetchClientDocuments(0, true);
        
        return { success: true, documentId };
      }
      
      // For text documents, use the original chunking logic
      const chunks = chunkDocument(content);
      
      // Get embeddings for each chunk from OpenAI
      try {
        await generateEmbeddings(chunks, documentId, clientId, metadata);
      } catch (embeddingError) {
        console.error("Error generating embeddings:", embeddingError);
        
        // If embedding fails, we'll still store the chunks without embeddings
        // Upload each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Store each chunk in the database
          const { error: chunkError } = await supabase
            .from('document_chunks')
            .insert({
              document_id: documentId,
              client_id: clientId,
              chunk_index: i,
              content: chunk,
              metadata: { ...metadata, chunkIndex: i, totalChunks: chunks.length }
            });
          
          if (chunkError) {
            throw new Error(`Error storing chunk ${i}: ${chunkError.message}`);
          }
        }
      }
      
      // Refresh the document list
      await fetchClientDocuments(0, true);
      
      return { success: true, documentId };
      
    } catch (error: any) {
      console.error("Error processing document:", error);
      
      toast({
        title: "Document processing failed",
        description: error.message || "An error occurred while processing the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, fetchClientDocuments, toast]);
  
  // Delete a document and its associated content
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!clientId) {
      console.error("Cannot delete document: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    if (!documentId) {
      console.error("Cannot delete document: No document ID provided");
      return { success: false, error: "No document ID provided" };
    }
    
    setIsProcessing(true);
    let deletionSuccess = false;
    let storageFilePath = null;
    let metadataData = null;
    let documentsToDelete = [];
    
    try {
      console.log(`Starting deletion process for document ${documentId} for client ${clientId}`);
      
      // 1. First verify document exists and belongs to this client
      const { data: verifyData, error: verifyError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('id', documentId)
        .eq('client_id', clientId)
        .single();
      
      if (verifyError) {
        console.error("Error verifying document existence:", verifyError);
        throw new Error(`Document verification failed: ${verifyError.message}`);
      }
      
      if (!verifyData) {
        throw new Error(`Document ${documentId} not found or doesn't belong to client ${clientId}`);
      }
      
      // Store metadata for later use
      metadataData = verifyData;
      documentsToDelete.push(documentId);
      
      // Check if there's a PDF file to delete
      if (metadataData?.url) {
        try {
          // Extract the file path from the URL
          const filePath = `${clientId}/${documentId}.pdf`;
          storageFilePath = filePath;
          console.log(`Will delete storage file at path: ${filePath}`);
        } catch (storageErr) {
          console.warn("Error processing storage path:", storageErr);
        }
      }
      
      console.log(`Confirmed document ${documentId} belongs to client ${clientId}, proceeding with deletion`);
      
      // 2. Check if document chunks exist
      const { data: chunksData, error: chunksCheckError } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact' })
        .eq('document_id', documentId)
        .eq('client_id', clientId);
      
      if (chunksCheckError) {
        console.error("Error checking for document chunks:", chunksCheckError);
        // Continue with deletion attempt even if checking chunks fails
      }
      
      const hasChunks = chunksData && chunksData.length > 0;
      console.log(`Document ${documentId} has chunks: ${hasChunks ? 'Yes' : 'No'}`);
      
      // 3. Delete document chunks if they exist
      if (hasChunks) {
        console.log(`Deleting ${chunksData.length} chunks for document ${documentId}`);
        const { error: chunksDeleteError } = await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId)
          .eq('client_id', clientId);
        
        if (chunksDeleteError) {
          console.error("Error deleting document chunks:", chunksDeleteError);
          throw new Error(`Failed to delete document chunks: ${chunksDeleteError.message}`);
        }
        console.log(`Successfully deleted chunks for document ${documentId}`);
      } else {
        console.log(`No chunks found for document ${documentId}, skipping chunk deletion`);
      }
      
      // 4. Delete document metadata
      console.log(`Deleting metadata for document ${documentId}`);
      const { error: metadataDeleteError } = await supabase
        .from('document_metadata')
        .delete()
        .eq('id', documentId)
        .eq('client_id', clientId);
      
      if (metadataDeleteError) {
        console.error("Error deleting document metadata:", metadataDeleteError);
        throw new Error(`Failed to delete document metadata: ${metadataDeleteError.message}`);
      }
      console.log(`Successfully deleted metadata for document ${documentId}`);
      
      // If we got here, the database deletion was successful
      deletionSuccess = true;
      
      // 5. Now attempt to delete the file from storage if it exists
      if (storageFilePath) {
        console.log(`Attempting to delete storage file at: ${storageFilePath}`);
        try {
          const { error: storageError } = await supabase
            .storage
            .from('client_documents')
            .remove([storageFilePath]);
          
          if (storageError) {
            // Just log this error but don't throw - the important part (database records) is deleted
            console.warn("Error deleting file from storage:", storageError);
          } else {
            console.log("Successfully deleted file from storage");
          }
        } catch (storageDeleteErr) {
          console.warn("Exception during storage deletion:", storageDeleteErr);
          // Don't fail the whole operation for storage errors
        }
      }
      
      // 6. Verify the document was actually deleted
      const { data: verifyDeletionData, error: verifyDeletionError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('id', documentId)
        .eq('client_id', clientId);
      
      if (verifyDeletionError) {
        console.warn("Error verifying document deletion:", verifyDeletionError);
        // Don't throw here, just log the warning
      }
      
      if (verifyDeletionData && verifyDeletionData.length > 0) {
        console.error(`Document ${documentId} still exists after deletion attempt!`);
        throw new Error("Document deletion failed: Document still exists in database");
      }
      
      // 7. Only update the UI state if the database deletion was successful and verified
      if (deletionSuccess) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        // Show success toast
        toast({
          title: "Document deleted",
          description: "Document and associated data has been removed.",
        });
      }
      
      console.log(`Document deletion process completed successfully for ${documentId}`);
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting document:", error);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, toast]);
  
  // Helper function to chunk document content
  const chunkDocument = (content: string): string[] => {
    // Simple chunking by paragraphs with a max length
    const MAX_CHUNK_LENGTH = 1000;
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: string[] = [];
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the max length, start a new chunk
      if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
    
    // Add the last chunk if there's anything left
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  // Search documents by vector similarity
  const searchDocumentsBySimilarity = useCallback(async (
    query: string,
    match_threshold: number = 0.7,
    match_count: number = 5
  ) => {
    if (!clientId || !query.trim()) {
      return { results: [], error: null };
    }

    try {
      // Get embedding for the query from OpenAI
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
      }
      
      const embeddingData = await response.json();
      const queryEmbedding = embeddingData.data[0].embedding;
      
      // Use the database function to search by similarity
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_document_chunks_by_similarity',
        {
          query_embedding: queryEmbedding,
          client_id_param: clientId,
          match_threshold,
          match_count
        }
      );
      
      if (searchError) {
        throw new Error(`Search error: ${searchError.message}`);
      }
      
      return { results: searchResults || [], error: null };
    } catch (error: any) {
      console.error("Error searching documents by similarity:", error);
      return { results: [], error: error.message };
    }
  }, [clientId]);

  return {
    documents,
    loading,
    hasError,
    hasMore,
    loadMore,
    isProcessing,
    processDocument,
    deleteDocument,
    searchDocumentsBySimilarity,
    refreshDocuments: (reset: boolean = true) => fetchClientDocuments(reset ? 0 : currentPage.current, reset)
  };
};
