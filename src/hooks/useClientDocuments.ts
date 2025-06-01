
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent } from "@/types/knowledge";
import { processPdfDocument } from "@/utils/pdfUtils";
import { deleteClientDocument } from "@/utils/api/baseApiService";

export const useClientDocuments = (
  clientId: string | undefined, 
  pageSize: number = 5,
  scope: "client-level" | string = "client-level"
) => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentPage = useRef(0);
  const isMounted = useRef(true);
  const { toast } = useToast();

  // Fetch documents based on scope
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
  }, [clientId, scope, fetchClientDocuments]);

  // Load more documents
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      currentPage.current += 1;
      await fetchClientDocuments(currentPage.current);
    }
  }, [hasMore, loading, fetchClientDocuments]);

  // Process document - handles both text and PDF
  const processDocument = useCallback(async (
    title: string, 
    content: string, 
    metadata: any = {},
    file?: File
  ) => {
    if (!clientId) {
      console.error("Cannot process document: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    setIsProcessing(true);
    
    try {
      // If it's a PDF file, use the PDF processing pipeline
      if (file && file.type === 'application/pdf') {
        console.log("Processing PDF file:", file.name);
        
        const caseId = scope !== "client-level" && scope !== "all" ? scope : undefined;
        const result = await processPdfDocument(file, title, clientId, caseId);
        
        if (result.success) {
          toast({
            title: "PDF processed successfully",
            description: "Your PDF has been uploaded and vectorized for search.",
          });
          
          // Refresh the document list
          await fetchClientDocuments(0, true);
          return result;
        } else {
          throw new Error(result.error || "Failed to process PDF");
        }
      }
      
      // Handle text documents
      const documentId = crypto.randomUUID();
      const caseId = scope !== "client-level" && scope !== "all" ? scope : null;
      
      // Insert document metadata
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title,
          client_id: clientId,
          case_id: caseId,
          schema: caseId ? 'case_document' : 'client_document',
          url: metadata.url || null,
          include_in_analysis: false // Default to false for new documents
        });
      
      if (metadataError) {
        throw new Error(`Error creating document metadata: ${metadataError.message}`);
      }
      
      // For text documents, create simple chunks
      const chunks = chunkDocument(content);
      
      // Store chunks directly (without embeddings for now - you may want to add this)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const { error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: documentId,
            client_id: clientId,
            case_id: caseId,
            chunk_index: i,
            content: chunk,
            metadata: { ...metadata, chunkIndex: i, totalChunks: chunks.length }
          });
        
        if (chunkError) {
          throw new Error(`Error storing chunk ${i}: ${chunkError.message}`);
        }
      }
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been saved.",
      });
      
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
  }, [clientId, scope, fetchClientDocuments, toast]);
  
  // Toggle document analysis inclusion with improved debugging and error handling
  const toggleDocumentAnalysis = useCallback(async (documentId: string, includeInAnalysis: boolean) => {
    if (!clientId) {
      console.error("Cannot toggle document analysis: No client ID provided");
      return { success: false, error: "No client ID provided" };
    }
    
    console.log(`[DEBUG] Toggling document ${documentId} analysis to: ${includeInAnalysis}`);
    console.log(`[DEBUG] Current documents state before toggle:`, documents.find(d => d.id === documentId)?.include_in_analysis);
    
    try {
      // Update database FIRST before optimistic update
      const { data, error } = await supabase
        .from('document_metadata')
        .update({ include_in_analysis: includeInAnalysis })
        .eq('id', documentId)
        .eq('client_id', clientId)
        .select('include_in_analysis');
      
      if (error) {
        console.error(`[ERROR] Database update failed:`, error);
        throw new Error(`Error updating document: ${error.message}`);
      }
      
      console.log(`[DEBUG] Database update successful:`, data);
      
      // Verify the update by fetching the document again
      const { data: verifyData, error: verifyError } = await supabase
        .from('document_metadata')
        .select('include_in_analysis')
        .eq('id', documentId)
        .eq('client_id', clientId)
        .single();
      
      if (verifyError) {
        console.error(`[ERROR] Verification query failed:`, verifyError);
      } else {
        console.log(`[DEBUG] Verification query result:`, verifyData);
      }
      
      // Now update local state to match database
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, include_in_analysis: includeInAnalysis }
            : doc
        )
      );
      
      console.log(`[DEBUG] Successfully updated document ${documentId} include_in_analysis to: ${includeInAnalysis}`);
      
      toast({
        title: includeInAnalysis ? "Document included in analysis" : "Document excluded from analysis",
        description: includeInAnalysis 
          ? "This document will now be considered during AI analysis."
          : "This document will be excluded from AI analysis.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error(`[ERROR] Error toggling document analysis:`, error);
      
      toast({
        title: "Error updating document",
        description: error.message || "An error occurred while updating the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    }
  }, [clientId, toast]);
  
  // Delete document
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
    console.log(`Starting deletion for document ${documentId} for client ${clientId}`);
    
    try {
      // Update UI state optimistically
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Call the edge function to delete the document
      const result = await deleteClientDocument(documentId, clientId);
      
      console.log(`Document deletion result:`, result);
      
      if (result.success) {
        toast({
          title: "Document deleted",
          description: "Document has been permanently removed.",
        });
        
        return { success: true };
      } else {
        // Restore the document in the UI
        setDocuments(prev => [...prev, ...documents.filter(doc => doc.id === documentId)]);
        
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
      console.error("Error in document deletion:", error);
      
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
  }, [clientId, documents, toast]);
  
  // Helper function to chunk document content
  const chunkDocument = (content: string): string[] => {
    const MAX_CHUNK_LENGTH = 1000;
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: string[] = [];
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      if (currentChunk.length > 0) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

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
    refreshDocuments: (reset: boolean = true) => fetchClientDocuments(reset ? 0 : currentPage.current, reset)
  };
};
