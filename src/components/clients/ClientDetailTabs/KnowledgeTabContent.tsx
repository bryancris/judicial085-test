
import React from "react";
import GoogleDocsEditor from "@/components/document-editor/GoogleDocsEditor";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface KnowledgeTabContentProps {
  clientId: string;
}

const KnowledgeTabContent: React.FC<KnowledgeTabContentProps> = ({ clientId }) => {
  const { toast } = useToast();

  const handleSaveDocument = async (title: string, content: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Save document metadata
      const { error } = await supabase
        .from('document_metadata')
        .insert({
          id: crypto.randomUUID(),
          title: title,
          client_id: clientId,
          schema: 'legal_document',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Document Saved",
        description: `"${title}" has been saved successfully.`,
      });
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

  return (
    <GoogleDocsEditor 
      clientId={clientId}
      onSave={handleSaveDocument}
    />
  );
};

export default KnowledgeTabContent;
