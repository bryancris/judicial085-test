
import React from "react";
import ClientDocumentsSection from "@/components/case-analysis/documents/ClientDocumentsSection";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { useClientCases } from "@/hooks/useClientCases";

interface DocumentsTabContentProps {
  clientId: string;
}

const DocumentsTabContent: React.FC<DocumentsTabContentProps> = ({ clientId }) => {
  const { cases } = useClientCases(clientId);
  
  const {
    documents,
    loading,
    isProcessing,
    processDocument,
    deleteDocument,
    toggleDocumentAnalysis,
    refreshDocuments
  } = useClientDocuments(clientId, 5, "all");

  return (
    <ClientDocumentsSection
      clientId={clientId}
      documents={documents}
      isLoading={loading}
      onProcessDocument={processDocument}
      onDeleteDocument={deleteDocument}
      onToggleDocumentAnalysis={toggleDocumentAnalysis}
      isProcessing={isProcessing}
      fullView={true}
      cases={cases}
      allowCaseSelection={true}
      onRefreshDocuments={refreshDocuments}
    />
  );
};

export default DocumentsTabContent;
