
import React, { useState } from "react";
import GoogleDocsEditor from "@/components/document-editor/GoogleDocsEditor";
import TemplateSelector from "./TemplateSelector";
import { useToast } from "@/hooks/use-toast";
import { useDocumentProcessor } from "@/hooks/documents/useDocumentProcessor";

interface KnowledgeTabContentProps {
  clientId: string;
}

const KnowledgeTabContent: React.FC<KnowledgeTabContentProps> = ({ clientId }) => {
  const { toast } = useToast();
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [initialTitle, setInitialTitle] = useState<string>("Untitled document");
  const [initialContent, setInitialContent] = useState<string>("");
  
  const { processDocument, updateDocument } = useDocumentProcessor(
    clientId,
    "client-level",
    () => {} // Empty refresh function since we're not showing a list here
  );

  const handleSaveDocument = async (title: string, content: string) => {
    try {
      if (currentDocumentId) {
        // Update existing document
        const result = await updateDocument(currentDocumentId, title, content, {
          schema: 'legal_document'
        });
        
        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Failed to update document";
          throw new Error(errorMessage);
        }
        
        toast({
          title: "Document Updated",
          description: `"${title}" has been updated successfully.`,
        });
      } else {
        // Create new document
        const result = await processDocument(title, content, {
          schema: 'legal_document'
        });
        
        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Failed to save document";
          throw new Error(errorMessage);
        }
        
        // Store the document ID for future updates - only if result was successful and has documentId
        if ('documentId' in result && result.documentId) {
          setCurrentDocumentId(result.documentId);
        }
        
        toast({
          title: "Document Saved",
          description: `"${title}" has been saved successfully.`,
        });
      }
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save document. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleTemplateSelect = (title: string, content: string) => {
    setInitialTitle(title);
    setInitialContent(content);
    setShowTemplateSelector(false);
  };

  const handleStartBlank = () => {
    setInitialTitle("Untitled document");
    setInitialContent("");
    setShowTemplateSelector(false);
  };

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        onTemplateSelect={handleTemplateSelect}
        onStartBlank={handleStartBlank}
      />
    );
  }

  return (
    <GoogleDocsEditor 
      clientId={clientId}
      onSave={handleSaveDocument}
      documentId={currentDocumentId || undefined}
      initialTitle={initialTitle}
      initialContent={initialContent}
    />
  );
};

export default KnowledgeTabContent;
