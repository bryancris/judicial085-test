import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Library, Upload, Search, FileText, Calendar, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuthState } from '@/hooks/useAuthState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFirmDocumentProcessingService } from '@/hooks/documents/services/firmDocumentProcessingService';
import QuickConsultDocumentUploadDialog from '@/components/quick-consult/QuickConsultDocumentUploadDialog';

const DocumentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { session } = useAuthState();
  const { processFileDocument, processTextDocument } = useFirmDocumentProcessingService();

  // Fetch documents from the library
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documentLibrary'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('document_metadata')
        .select('*')
        .is('client_id', null) // Library documents have null client_id
        .not('firm_id', 'is', null) // But have a firm_id
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching document library:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.processing_notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = () => {
    setShowUploadDialog(false);
    refetch(); // Refresh the documents list
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Processed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Library className="h-8 w-8 text-brand-burgundy" />
            <h1 className="text-3xl font-bold">Document Library</h1>
          </div>
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
        
        <p className="text-lg mb-6 text-muted-foreground">
          Your firm's searchable document hub. Access and manage all documents uploaded by your team.
        </p>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search document library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-brand-burgundy animate-spin mb-4" />
            <p className="text-lg">Loading documents...</p>
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-brand-burgundy" />
                      <span className="truncate">{document.title || 'Untitled Document'}</span>
                    </CardTitle>
                    {getStatusBadge(document.processing_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(document.created_at)}
                    </div>
                    
                    {document.processing_notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {document.processing_notes}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      {document.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.url, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {searchTerm ? 'No documents match your search' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Upload your first document to get started.'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        )}

        {/* Upload Dialog */}
        <QuickConsultDocumentUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
        />
      </main>
    </div>
  );
};

export default DocumentLibrary;