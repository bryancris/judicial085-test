
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

  // Fetch documents from the documents table
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
      
      // Fetch from documents table with metadata filtering
      let query = supabase
        .from('documents')
        .select('*');
      
      // Build metadata filter for client_id
      let metadataFilter: any = {
        client_id: clientId
      };
      
      // Apply scope filtering in metadata
      if (scope === "client-level") {
        // For client-level, we want documents without case_id or with null case_id
        metadataFilter.case_id = null;
      } else if (scope !== "all") {
        // Specific case ID
        metadataFilter.case_id = scope;
      }
      
      // Apply metadata filter
      query = query.contains('metadata', metadataFilter);
      
      const { data: documentsData, error: documentsError } = await query
        .order('id', { ascending: false })
        .range(from, to);
      
      if (documentsError) {
        console.error("Error fetching documents:", documentsError);
        if (isMounted.current) {
          setHasError(true);
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Determine if there are more records to fetch
      const hasMore = documentsData && documentsData.length === pageSize;
      setHasMore(hasMore);
      
      if (!documentsData || documentsData.length === 0) {
        console.log("No documents found for this client and scope");
        
        if (resetResults && isMounted.current) {
          setDocuments([]);
        }
        if (isMounted.current) {
          setLoading(false);
        }
        return { hasMore: false };
      }

      // Transform documents data to DocumentWithContent format
      const transformedDocuments: DocumentWithContent[] = documentsData.map((doc) => {
        const metadata = doc.metadata || {};
        
        // Extract document info from metadata with proper type safety
        const title = getMetadataProperty(metadata, 'title') || 
                     getMetadataProperty(metadata, 'file_title') || 
                     `Document ${doc.id}`;
        const createdAt = getMetadataProperty(metadata, 'created_at') || new Date().toISOString();
        const caseId = getMetadataProperty(metadata, 'case_id') || null;
        const fileType = getMetadataProperty(metadata, 'file_type');
        const isPdfFlag = getMetadataProperty(metadata, 'isPdfDocument');
        const isPdf = fileType === 'pdf' || isPdfFlag === true || (typeof title === 'string' && title.toLowerCase().endsWith('.pdf'));
        const pdfUrl = getMetadataProperty(metadata, 'pdf_url') || 
                      getMetadataProperty(metadata, 'pdfUrl') || 
                      getMetadataProperty(metadata, 'file_path') || 
                      getMetadataProperty(metadata, 'url');
        
        return {
          id: doc.id.toString(),
          title: typeof title === 'string' ? title : `Document ${doc.id}`,
          url: typeof pdfUrl === 'string' ? pdfUrl : null,
          created_at: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
          schema: isPdf ? 'pdf' : 'document',
          case_id: typeof caseId === 'string' ? caseId : null,
          client_id: clientId,
          contents: [{
            id: 1,
            content: doc.content || '',
            metadata: {
              ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
              isPdfDocument: isPdf,
              pdfUrl: typeof pdfUrl === 'string' ? pdfUrl : null
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
