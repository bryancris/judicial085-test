import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Layout, Search, Upload, ArrowLeft } from "lucide-react";
import TemplateUpload from "./TemplateUpload";
import TemplateCard from "./TemplateCard";
import GoogleDocsEditor from "@/components/document-editor/GoogleDocsEditor";
import { useTemplates } from "@/hooks/useTemplates";
import mammoth from "mammoth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

interface TemplatesTabContentProps {
  clientId: string;
}

const TemplatesTabContent: React.FC<TemplatesTabContentProps> = ({ clientId }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const { templates, loading, refetch } = useTemplates();
  const { toast } = useToast();

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditTemplate = async (template: Template) => {
    try {
      // Download the template file from storage
      const { data, error } = await supabase.storage
        .from('templates')
        .download(template.file_path);

      if (error) throw error;

      // Convert Word document to HTML using mammoth
      const arrayBuffer = await data.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      setTemplateContent(result.value);
      setEditingTemplate(template);
    } catch (error) {
      console.error('Error loading template for editing:', error);
      toast({
        title: "Error",
        description: "Failed to load template for editing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async (title: string, content: string) => {
    if (!editingTemplate) return;

    try {
      // Convert HTML content back to a Word document format
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.15; margin: 1in; }
              p { margin: 0 0 8pt 0; }
              h1, h2, h3, h4, h5, h6 { margin: 0 0 8pt 0; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;

      // Create a blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const file = new File([blob], `${editingTemplate.file_name}`, { type: 'text/html' });

      // Upload the updated template
      const filePath = `${Date.now()}_${editingTemplate.file_name}`;
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update the template record with new file path and updated name
      const { error: updateError } = await supabase
        .from('templates')
        .update({
          name: title,
          file_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (updateError) throw updateError;

      // Remove the old file
      await supabase.storage
        .from('templates')
        .remove([editingTemplate.file_path]);

      toast({
        title: "Success",
        description: "Template updated successfully.",
      });

      // Reset editing state and refresh templates
      setEditingTemplate(null);
      setTemplateContent("");
      refetch();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If editing a template, show the editor
  if (editingTemplate) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingTemplate(null);
              setTemplateContent("");
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Edit Template: {editingTemplate.name}</h2>
            <p className="text-sm text-muted-foreground">Make changes to your template</p>
          </div>
        </div>
        <div className="flex-1">
          <GoogleDocsEditor
            clientId={clientId}
            onSave={handleSaveTemplate}
            initialTitle={editingTemplate.name}
            initialContent={templateContent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Layout className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold">Template Library</h2>
            <p className="text-muted-foreground">
              Upload and manage document templates for your firm
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <TemplateUpload 
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            refetch();
          }}
        />
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id} 
              template={template}
              onUpdate={refetch}
              onEdit={handleEditTemplate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layout className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {searchTerm 
                  ? "No templates match your search criteria."
                  : "Upload your first Word document template to get started building your firm's template library."
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload First Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplatesTabContent;