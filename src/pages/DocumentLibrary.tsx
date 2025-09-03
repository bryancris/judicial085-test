import React, { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Library, Upload, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthState } from '@/hooks/useAuthState';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFirmDocumentProcessingService } from '@/hooks/documents/services/firmDocumentProcessingService';
import { useFirmDocumentManager } from '@/hooks/useFirmDocumentManager';
import { DocumentWithContent } from '@/types/knowledge';
import DocumentLibraryCard from '@/components/knowledge/DocumentLibraryCard';
import AttorneyResearchDocumentUploadDialog from '@/components/attorney-research/AttorneyResearchDocumentUploadDialog';
import { TemplatesDialog } from '@/components/templates/TemplatesDialog';

const DocumentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentsWithContent, setDocumentsWithContent] = useState<DocumentWithContent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const { toggleDocumentAnalysis, deleteDocument } = useFirmDocumentManager(
    documentsWithContent,
    setDocumentsWithContent
  );

  // Fetch document content for each document
  useEffect(() => {
    const fetchDocumentContent = async () => {
      if (!documents.length) {
        setDocumentsWithContent([]);
        return;
      }

      const documentsWithContentPromises = documents.map(async (doc) => {
        try {
          // Fetch content for this document
          const { data: chunks, error } = await supabase
            .from('document_chunks')
            .select('*')
            .eq('document_id', doc.id)
            .order('chunk_index', { ascending: true })
            .limit(5); // Limit to first 5 chunks for preview

          if (error) {
            console.error(`Error fetching content for document ${doc.id}:`, error);
            return {
              ...doc,
              contents: [],
              fetchError: error.message
            } as DocumentWithContent;
          }

          const contents = chunks?.map((chunk, index) => ({
            id: index + 1, // Use index as a number ID
            content: chunk.content,
            metadata: chunk.metadata || {},
            embedding: null
          })) || [];

          return {
            ...doc,
            contents
          } as DocumentWithContent;

        } catch (error) {
          console.error(`Exception fetching content for document ${doc.id}:`, error);
          return {
            ...doc,
            contents: [],
            fetchError: 'Failed to fetch content'
          } as DocumentWithContent;
        }
      });

      try {
        const results = await Promise.all(documentsWithContentPromises);
        setDocumentsWithContent(results);
      } catch (error) {
        console.error('Error fetching document content:', error);
      }
    };

    fetchDocumentContent();
  }, [documents.length]); // Use documents.length instead of documents array

  // Filter documents based on search term
  const filteredDocuments = documentsWithContent.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleUpload = () => {
    setShowUploadDialog(false);
    refetch(); // Refresh the documents list
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
          <div className="flex items-center gap-3">
            <TemplatesDialog />
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="bg-brand-burgundy hover:bg-brand-burgundy/90 text-white flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
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
              <DocumentLibraryCard
                key={document.id}
                document={document}
                onDeleteDocument={deleteDocument}
                onToggleAnalysis={toggleDocumentAnalysis}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {searchTerm ? 'No documents match your search' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.' 
                : 'Upload your first document to get started building your document library.'
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
        <AttorneyResearchDocumentUploadDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
        />
      </main>
    </div>
  );
};

export default DocumentLibrary;