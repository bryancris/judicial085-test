
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentWithContent, DocumentMetadata } from '@/types/knowledge';

export const useDocuments = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentWithContent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Authentication check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchDocuments();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch documents from Supabase
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // First, get all document metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('document_metadata')
        .select('*');
      
      if (metadataError) {
        throw metadataError;
      }

      if (!metadataData || metadataData.length === 0) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      console.log('Fetched metadata:', metadataData);

      // Next, fetch document content for each document
      const documentsWithContent: DocumentWithContent[] = await Promise.all(
        metadataData.map(async (metadata: DocumentMetadata) => {
          console.log(`Fetching content for document ${metadata.id}`);
          
          // Debug the format of the ID to ensure it matches what's in the database
          console.log('Document ID format:', metadata.id);
          
          const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .filter('metadata->>file_id', 'eq', metadata.id);
          
          if (documentError) {
            console.error(`Error fetching content for document ${metadata.id}:`, documentError);
            return {
              ...metadata,
              contents: []
            };
          }
          
          console.log(`Content for document ${metadata.id}:`, documentData);
          
          return {
            ...metadata,
            contents: documentData || []
          };
        })
      );

      setDocuments(documentsWithContent);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error fetching documents",
        description: "Could not retrieve document information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // For now, we'll just implement client-side filtering
    // In a production app, you would want to implement server-side search
    setIsSearching(false);
  };

  // Clear search
  const clearSearch = () => setSearchTerm('');

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.metadata?.file_title && 
       content.metadata.file_title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  return {
    session,
    loading,
    documents: filteredDocuments,
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearch,
    clearSearch
  };
};
