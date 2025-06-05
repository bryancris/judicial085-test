
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProcessDocumentContentFunction } from "@/types/caseAnalysis";

export const useDocumentsData = (clientId: string) => {
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);

  const fetchClientDocuments = useCallback(async () => {
    if (!clientId) return;
    
    setDocumentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("document_metadata")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClientDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [clientId]);

  const processDocument: ProcessDocumentContentFunction = async (title: string, content: string, metadata?: any) => {
    setIsProcessingDocument(true);
    try {
      console.log("Processing document:", title);
      // Add your document processing logic here
    } catch (error) {
      console.error("Error processing document:", error);
      throw error;
    } finally {
      setIsProcessingDocument(false);
    }
  };

  return {
    clientDocuments,
    documentsLoading,
    isProcessingDocument,
    fetchClientDocuments,
    processDocument
  };
};
