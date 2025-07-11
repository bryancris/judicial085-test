import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Layout, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  FileText,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
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

interface TemplateCardProps {
  template: Template;
  onUpdate: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('templates')
        .download(template.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      setLoading(true);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove([template.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('templates')
        .delete()
        .eq('id', template.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Template deleted successfully.",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-blue-600" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{template.name}</CardTitle>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                disabled={loading}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className="capitalize">
              {template.category}
            </Badge>
            <span className="text-muted-foreground">
              {formatFileSize(template.file_size)}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              .docx
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleDownload}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;