import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent } from "@/types/knowledge";
import { extractTextFromPdf, uploadPdfToStorage, generateEmbeddings } from "@/utils/pdfUtils";
import { deleteClientDocument } from "@/utils/api/baseApiService";

export const useCaseDocuments = (clientId: string | undefined, caseId: string | undefined, pageSize: number = 5) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentPage = useRef(0);
  const isMounted = useRef(true);
  const { toast } = useToast();

  const fetchCaseDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    if (!clientId || !caseId) return { hasMore: false };
    
    try {
      console.log(`Fetching case documents for client ${clientId}, case ${caseId}, page ${pageIndex}`);
      
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
      
      // Get document metadata for this specific case
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('client_id', clientId)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (metadataError) {
        console.error("Error fetching case document metadata:", metadataError);
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
        console.log("No document metadata found for this case");
        
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
          // Fetch document chunks for this document and case
          const { data: chunkData, error: chunkError } = await supabase
            .from('document_chunks')
            .select('*')
            .eq('document_id', docStub.id)
            .eq('client_id', clientId)
            .eq('case_id', caseId)
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
      console.error('Error in fetchCaseDocuments:', error);
      if (isMounted.current) {
        setHasError(true);
        setLoading(false);
      }
      return { hasMore: false };
    }
  }, [clientId, caseId, pageSize]);

  useEffect(() => {
    isMounted.current = true;
    
    if (clientId && caseId) {
      fetchCaseDocuments(0, true);
    } else {
      setDocuments([]);
      setLoading(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [clientId, caseId, fetchCaseDocuments]);

  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      currentPage.current += 1;
      await fetchCaseDocuments(currentPage.current);
    }
  }, [hasMore, loading, fetchCaseDocuments]);

  // Process and chunk a document for a specific case
  const processDocument = useCallback(async (
    title: string, 
    content: string, 
    metadata: any = {}
  ) => {
    if (!clientId || !caseId) {
      console.error("Cannot process document: No client ID or case ID provided");
      return { success: false, error: "No client ID or case ID provided" };
    }
    
    setIsProcessing(true);
    
    try {
      // Generate a unique ID for the document
      const documentId = crypto.randomUUID();
      
      // Insert document metadata with case_id
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title,
          client_id: clientId,
          case_id: caseId,
          schema: 'case_document',
          url: metadata.pdfUrl || null,
          include_in_analysis: false // Default to false for new documents
        });
      
      if (metadataError) {
        throw new Error(`Error creating document metadata: ${metadataError.message}`);
      }
      
      if (metadata.isPdfDocument) {
        // Embeddings already generated by the upload process
        // Refresh the document list
        await fetchCaseDocuments(0, true);
        
        return { success: true, documentId };
      }
      
      // For text documents, use the original chunking logic
      const chunks = chunkDocument(content);
      
      // Get embeddings for each chunk from OpenAI
      try {
        await generateEmbeddings(chunks, documentId, clientId, { ...metadata, caseId });
      } catch (embeddingError) {
        console.error("Error generating embeddings:", embeddingError);
        
        // If embedding fails, we'll still store the chunks without embeddings
        // Upload each chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Store each chunk in the database with case_id
          const { error: chunkError } = await supabase
            .from('document_chunks')
            .insert({
              document_id: documentId,
              client_id: clientId,
              case_id: caseId,
              chunk_index: i,
              content: chunk,
              metadata: { ...metadata, chunkIndex: i, totalChunks: chunks.length, caseId }
            });
          
          if (chunkError) {
            throw new Error(`Error storing chunk ${i}: ${chunkError.message}`);
          }
        }
      }
      
      // Refresh the document list
      await fetchCaseDocuments(0, true);
      
      return { success: true, documentId };
      
    } catch (error: any) {
      console.error("Error processing case document:", error);
      
      toast({
        title: "Document processing failed",
        description: error.message || "An error occurred while processing the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, caseId, fetchCaseDocuments, toast]);
  
  const deleteDocument = useCallback(async (documentId: string) => {
    if (!clientId || !caseId) {
      console.error("Cannot delete document: No client ID or case ID provided");
      return { success: false, error: "No client ID or case ID provided" };
    }
    
    if (!documentId) {
      console.error("Cannot delete document: No document ID provided");
      return { success: false, error: "No document ID provided" };
    }
    
    setIsProcessing(true);
    console.log(`Starting deletion for case document ${documentId} for client ${clientId}, case ${caseId}`);
    
    try {
      // 1. Update UI state optimistically (can be rolled back if deletion fails)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // 2. Call the edge function to delete the document with admin privileges
      const result = await deleteClientDocument(documentId, clientId);
      
      console.log(`Case document deletion result:`, result);
      
      if (result.success) {
        // Show success toast
        toast({
          title: "Document deleted",
          description: "Case document has been permanently removed.",
        });
        
        return { success: true };
      } else {
        // If failed, restore the document in the UI
        setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
        
        // Show error toast with the error from the edge function
        toast({
          title: "Error deleting document",
          description: result.error || "An error occurred while deleting the document.",
          variant: "destructive",
        });
        
        return { 
          success: false, 
          error: result.error || "Failed to delete document" 
        };
      }
    } catch (error: any) {
      console.error("Error in case document deletion:", error);
      
      // Restore document in UI on error
      setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, caseId, documents, toast]);
  
  // Toggle document analysis inclusion with improved state management
  const toggleDocumentAnalysis = useCallback(async (documentId: string, includeInAnalysis: boolean) => {
    if (!clientId || !caseId) {
      console.error("Cannot toggle document analysis: No client ID or case ID provided");
      return { success: false, error: "No client ID or case ID provided" };
    }
    
    console.log(`Toggling case document ${documentId} analysis to: ${includeInAnalysis}`);
    
    try {
      // Optimistically update local state first
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, include_in_analysis: includeInAnalysis }
            : doc
        )
      );

      // Update database
      const { error } = await supabase
        .from('document_metadata')
        .update({ include_in_analysis: includeInAnalysis })
        .eq('id', documentId)
        .eq('client_id', clientId)
        .eq('case_id', caseId);
      
      if (error) {
        // Revert optimistic update on error
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, include_in_analysis: !includeInAnalysis }
              : doc
          )
        );
        throw new Error(`Error updating document: ${error.message}`);
      }
      
      console.log(`Successfully updated case document ${documentId} include_in_analysis to: ${includeInAnalysis}`);
      
      toast({
        title: includeInAnalysis ? "Document included in analysis" : "Document excluded from analysis",
        description: includeInAnalysis 
          ? "This document will now be considered during AI analysis."
          : "This document will be excluded from AI analysis.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error("Error toggling case document analysis:", error);
      
      toast({
        title: "Error updating document",
        description: error.message || "An error occurred while updating the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, caseId, toast]);
  
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

  // Search case documents by vector similarity
  const searchDocumentsBySimilarity = useCallback(async (
    query: string,
    match_threshold: number = 0.7,
    match_count: number = 5
  ) => {
    if (!clientId || !caseId || !query.trim()) {
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
      
      // Use the database function to search by similarity for this specific case
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_case_document_chunks_by_similarity',
        {
          query_embedding: queryEmbedding,
          case_id_param: caseId,
          match_threshold,
          match_count
        }
      );
      
      if (searchError) {
        throw new Error(`Search error: ${searchError.message}`);
      }
      
      return { results: searchResults || [], error: null };
    } catch (error: any) {
      console.error("Error searching case documents by similarity:", error);
      return { results: [], error: error.message };
    }
  }, [clientId, caseId]);

  return {
    documents,
    loading,
    hasError,
    hasMore,
    loadMore,
    isProcessing,
    processDocument,
    deleteDocument,
    toggleDocumentAnalysis,
    searchDocumentsBySimilarity,
    refreshDocuments: (reset: boolean = true) => fetchCaseDocuments(reset ? 0 : currentPage.current, reset)
  };
};
