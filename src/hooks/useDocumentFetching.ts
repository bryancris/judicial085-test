
import { useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DocumentWithContent } from "@/types/knowledge";
import { isValidUUID, parseDocumentId } from "@/utils/documentValidation";
import { getMetadataProperty, isPdfDocument, generatePdfUrl } from "@/utils/documentMetadata";

export const useDocumentFetching = (
  clientId: string | undefined,
  scope: "client-level" | string = "client-level",
  pageSize: number = 5
) => {
  const isMounted = useRef(true);

  const fetchClientDocuments = useCallback(async (pageIndex: number, resetResults: boolean = false) => {
    if (!clientId) return { hasMore: false, documents: [] };
    
    try {
      console.log(`Fetching documents for client ${clientId}, scope ${scope}, page ${pageIndex}`);
      
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
        throw new Error(`Failed to fetch document chunks: ${chunksError.message}`);
      }

      if (!chunks || chunks.length === 0) {
        console.log("No document chunks found for this client and scope");
        return { hasMore: false, documents: [] };
      }

      // Get unique document IDs and validate them
      const validDocumentIds = [...new Set(chunks.map(chunk => chunk.document_id))]
        .map(id => parseDocumentId(id))
        .filter((id): id is number => id !== null);

      console.log("Valid document IDs:", validDocumentIds);
      
      if (validDocumentIds.length === 0) {
        console.log("No valid document IDs found");
        return { hasMore: false, documents: [] };
      }
      
      // Paginate the document IDs
      const paginatedDocIds = validDocumentIds.slice(from, to + 1);
      const hasMore = validDocumentIds.length > to + 1;
      
      if (paginatedDocIds.length === 0) {
        return { hasMore, documents: [] };
      }

      // Now fetch the actual documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .in('id', paginatedDocIds);
      
      if (documentsError) {
        console.error("Error fetching documents:", documentsError);
        throw new Error(`Failed to fetch documents: ${documentsError.message}`);
      }

      if (!documentsData || documentsData.length === 0) {
        console.log("No documents found for the document IDs");
        return { hasMore, documents: [] };
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
        
        // Determine if it's a PDF using improved detection
        const isPdf = isPdfDocument(metadata, typeof fileTitle === 'string' ? fileTitle : undefined);
        
        // Generate PDF URL if it's a PDF
        const pdfUrl = isPdf ? generatePdfUrl(metadata) : null;
        
        console.log(`Document ${doc.id}: isPdf=${isPdf}, pdfUrl=${pdfUrl}, content length=${doc.content?.length || 0}`);
        
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
              file_id: getMetadataProperty(metadata, 'file_id'),
              blobType: getMetadataProperty(metadata, 'blobType'),
              source: getMetadataProperty(metadata, 'source')
            }
          }]
        };
      });

      console.log(`Transformed ${transformedDocuments.length} documents`);
      return { hasMore, documents: transformedDocuments };
      
    } catch (error) {
      console.error('Error in fetchClientDocuments:', error);
      throw error;
    }
  }, [clientId, scope, pageSize]);

  return {
    fetchClientDocuments,
    isMounted
  };
};
