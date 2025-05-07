
import React, { useState } from 'react';
import { DiscoveryResponse } from '@/types/discovery';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Download, 
  Save, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DiscoveryResponseEditorProps {
  response: DiscoveryResponse;
  clientId: string;
  requestId: string;
}

const ResponseStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Draft</Badge>;
    case 'review':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Review</Badge>;
    case 'final':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Final</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const DiscoveryResponseEditor: React.FC<DiscoveryResponseEditorProps> = ({ 
  response,
  clientId,
  requestId
}) => {
  const [content, setContent] = useState(response.content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // In a real implementation, we would save the edited response to the database
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast({
        title: "Response saved",
        description: "Your changes have been saved successfully",
      });
    }, 1000);
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // In a real implementation, we would export the response to a Word document
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Response exported",
        description: "Your response has been exported to Word format",
      });
    }, 1000);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Response {formatDate(response.created_at)}
            </CardTitle>
            <CardDescription className="mt-1">
              Last modified: {formatDate(response.updated_at)}
            </CardDescription>
          </div>
          <ResponseStatusBadge status={response.status} />
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
        ) : (
          <div className="whitespace-pre-wrap font-mono text-sm max-h-[300px] overflow-y-auto">
            {content}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {!isEditing ? (
            <Button variant="outline" onClick={handleEdit}>
              Edit Response
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Word
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default DiscoveryResponseEditor;
