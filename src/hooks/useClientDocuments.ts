
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

  // Helper function to safely access metadata properties
  const getMetadataProperty = (metadata: any, key: string): any => {
    if (!metadata || typeof metadata !== 'object') return null;
    return metadata[key] || null;
  };

  // Helper function to validate if a string is a valid UUID
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Helper function to validate and parse document ID
  const parseDocumentId = (documentId: string): number | null => {
    const parsed = parseInt(documentId, 10);
    return isNaN(parsed) ? null : parsed;
  };

  // Fetch documents associated with the client through document_chunks table
  const fetchClientDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    if (!clientId) return { hasMore: false };
    
    try {
      console.log(`Fetching documents for client ${clientId}, scope ${scope}, page ${pageIndex}`);
      
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
      
      // First, get document IDs associated with this client from document_chunks
      let chunkQuery = supabase
        .from('document_chunks')
        .select('document_id, case_id, metadata')
        .eq('client_id', clientId);
      
      // Apply scope filtering with proper UUID validation
      if (scope === "client-level") {
        chunkQuery = chunkQuery.or('case_id.is.null');
      } else if (scope !== "all") {
        // Only apply case_id filter if scope is a valid UUID
        if (isValidUUID(scope)) {
          chunkQuery = chunkQuery.eq('case_id', scope);
        } else {
          console.warn(`Invalid scope UUID: ${scope}, falling back to client-level`);
          chunkQuery = chunkQuery.or('case_id.is.null');
        }
      }
      
      const { data: chunks, error: chunksError } = await chunkQuery;
      
      if (chunksError) {
        console.error("Error fetching document chunks:", chunksError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
        }
        return { hasMore: false };
      }

      if (!chunks || chunks.length === 0) {
        console.log("No document chunks found for this client and scope");
        
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Get unique document IDs and validate them
      const validDocumentIds = [...new Set(chunks.map(chunk => chunk.document_id))]
        .map(id => parseDocumentId(id))
        .filter((id): id is number => id !== null);

      console.log("Valid document IDs:", validDocumentIds);
      
      if (validDocumentIds.length === 0) {
        console.log("No valid document IDs found");
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }
      
      // Paginate the document IDs
      const paginatedDocIds = validDocumentIds.slice(from, to + 1);
      const hasMore = validDocumentIds.length > to + 1;
      setHasMore(hasMore);
      
      if (paginatedDocIds.length === 0) {
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore };
      }

      // Now fetch the actual documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', paginatedDocIds);
      
      if (documentsError) {
        console.error("Error fetching documents:", documentsError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
        }
        return { hasMore };
      }

      if (!documentsData || documentsData.length === 0) {
        console.log("No documents found for the document IDs");
        
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore };
      }

      // Transform documents data to DocumentWithContent format
      const transformedDocuments: DocumentWithContent[] = documentsData.map((doc) => {
        const metadata = doc.metadata || {};
        
        // Find the case_id from chunks for this document
        const associatedChunk = chunks.find(chunk => parseDocumentId(chunk.document_id) === doc.id);
        const caseId = associatedChunk?.case_id || null;
        
        // Extract document info from metadata with proper type safety
        const fileTitle = getMetadataProperty(metadata, 'file_title') || 
                         getMetadataProperty(metadata, 'title') || 
                         `Document ${doc.id}`;
        const fileId = getMetadataProperty(metadata, 'file_id');
        const blobType = getMetadataProperty(metadata, 'blobType');
        const source = getMetadataProperty(metadata, 'source');
        
        // Determine if it's a PDF
        const isPdf = (typeof fileTitle === 'string' && fileTitle.toLowerCase().endsWith('.pdf')) ||
                     blobType === 'application/pdf';
        
        // Generate PDF URL if it's a PDF with file_id
        let pdfUrl = null;
        if (isPdf && fileId) {
          pdfUrl = `https://drive.google.com/file/d/${fileId}/view`;
        }
        
        return {
          id: doc.id.toString(),
          title: typeof fileTitle === 'string' ? fileTitle : `Document ${doc.id}`,
          url: pdfUrl,
          created_at: new Date().toISOString(),
          schema: isPdf ? 'pdf' : 'document',
          case_id: typeof caseId === 'string' ? caseId : null,
          client_id: clientId,
          contents: [{
            id: 1,
            content: doc.content || '',
            metadata: {
              ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
              isPdfDocument: isPdf,
              pdfUrl: pdfUrl,
              file_id: fileId,
              blobType: blobType,
              source: source
            }
          }]
        };
      });

      if (resetResults && isMounted.current) {
        setDocuments(transformedDocuments);
      } else if (isMounted.current) {
        // Make sure we don't add duplicates
        setDocuments(prev => {
          const existingIds = new Set(prev.map(doc => doc.id));
          const newDocs = transformedDocuments.filter(doc => !existingIds.has(doc.id));
          return [...prev, ...newDocs];
        });
      }

      if (isMounted.current) {
        setLoading(false);
      }
      
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
      
      // Handle text documents - store in documents table
      const caseId = scope !== "client-level" && scope !== "all" ? scope : null;
      
      const documentMetadata = {
        client_id: clientId,
        case_id: caseId,
        title: title,
        file_type: 'text',
        created_at: new Date().toISOString(),
        ...metadata
      };
      
      // Insert into documents table
      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: content,
          metadata: documentMetadata
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error creating document: ${error.message}`);
      }
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been saved.",
      });
      
      // Refresh the document list
      await fetchClientDocuments(0, true);
      
      return { success: true, documentId: data.id };
      
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
      
      // Convert string ID to number for database deletion
      const numericId = parseInt(documentId, 10);
      if (isNaN(numericId)) {
        throw new Error("Invalid document ID format");
      }
      
      // Delete from documents table
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', numericId);
      
      if (error) {
        throw new Error(`Error deleting document: ${error.message}`);
      }
      
      toast({
        title: "Document deleted",
        description: "Document has been permanently removed.",
      });
      
      return { success: true };
      
    } catch (error: any) {
      console.error("Error in document deletion:", error);
      
      // Restore document in UI on error
      await fetchClientDocuments(0, true);
      
      toast({
        title: "Error deleting document",
        description: error.message || "An error occurred while deleting the document.",
        variant: "destructive",
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, [clientId, toast, fetchClientDocuments]);

  return {
    documents,
    loading,
    hasError,
    hasMore,
    loadMore,
    isProcessing,
    processDocument,
    deleteDocument,
    refreshDocuments: (reset: boolean = true) => fetchClientDocuments(reset ? 0 : currentPage.current, reset)
  };
};
