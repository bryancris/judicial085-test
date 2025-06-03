
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Scale 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KNOWLEDGE_BASE_LAW_DOCS } from '@/utils/lawReferences/knowledgeBaseMapping';

interface UploadedDocument {
  name: string;
  size: number;
  created_at: string;
  id: string;
  url: string;
}

const TexasLawDocuments = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  // Expected documents from the knowledge base mapping
  const expectedDocuments = KNOWLEDGE_BASE_LAW_DOCS;

  useEffect(() => {
    fetchUploadedDocuments();
  }, []);

  const fetchUploadedDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "Failed to fetch uploaded documents",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const documentsWithUrls = data.map(file => ({
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at || '',
          id: file.id || file.name,
          url: supabase.storage.from('documents').getPublicUrl(file.name).data.publicUrl
        }));
        setUploadedDocuments(documentsWithUrls);
      }
    } catch (error) {
      console.error('Error in fetchUploadedDocuments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF files",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(file.name, file, {
          cacheControl: '3600',
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${file.name} uploaded successfully`,
      });

      // Refresh the documents list
      await fetchUploadedDocuments();

      // Reset file input
      event.target.value = '';

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([fileName]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${fileName} deleted successfully`,
      });

      // Refresh the documents list
      await fetchUploadedDocuments();

    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const getDocumentStatus = (filename: string) => {
    return uploadedDocuments.some(doc => doc.name === filename);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-brand-burgundy animate-spin mb-4" />
        <p className="text-lg">Loading Texas law documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-6 w-6 text-brand-burgundy" />
        <h2 className="text-2xl font-semibold">Texas Law Documents</h2>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload the official Texas law documents that are referenced in case analysis. 
          These PDFs will be directly accessible when users click "View Document" in legal analysis.
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Law Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload PDF files only. Maximum size: 50MB
              </p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expected Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle>Required Texas Law Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expectedDocuments.map((doc) => {
              const isUploaded = getDocumentStatus(doc.filename);
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Filename: {doc.filename}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 rounded ${
                      isUploaded 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isUploaded ? 'Uploaded' : 'Missing'}
                    </span>
                    {isUploaded && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const uploadedDoc = uploadedDocuments.find(d => d.name === doc.filename);
                          if (uploadedDoc) {
                            window.open(uploadedDoc.url, '_blank');
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Uploaded Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(doc.size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TexasLawDocuments;
