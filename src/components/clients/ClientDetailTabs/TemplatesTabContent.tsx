import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Layout, Search, Upload } from "lucide-react";
import TemplateUpload from "./TemplateUpload";
import TemplateCard from "./TemplateCard";
import { useTemplates } from "@/hooks/useTemplates";

interface TemplatesTabContentProps {
  clientId: string;
}

const TemplatesTabContent: React.FC<TemplatesTabContentProps> = ({ clientId }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { templates, loading, refetch } = useTemplates();

  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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