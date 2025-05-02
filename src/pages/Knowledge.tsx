
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import NavBar from '@/components/NavBar';
import { BookOpen, Search, FileText, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";

// Type definitions for our document data
interface DocumentMetadata {
  id: string;
  title: string;
  url: string | null;
  created_at: string;
  schema: string | null;
}

interface DocumentContent {
  id: number;
  content: string;
  metadata: {
    file_title?: string;
    source?: string;
    location?: {
      page?: number;
    };
  };
}

interface DocumentWithContent extends DocumentMetadata {
  contents: DocumentContent[];
}

const Knowledge = () => {
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

      // Next, fetch document content for each document
      const documentsWithContent: DocumentWithContent[] = await Promise.all(
        metadataData.map(async (metadata: DocumentMetadata) => {
          const { data: documentData, error: documentError } = await supabase
            .from('documents')
            .select('*')
            .filter('metadata->file_id', 'eq', metadata.id);
          
          if (documentError) {
            console.error(`Error fetching content for document ${metadata.id}:`, documentError);
            return {
              ...metadata,
              contents: []
            };
          }
          
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

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contents.some(content => 
      content.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.metadata?.file_title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // If not authenticated, redirect to auth page
  if (!loading && !session) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-8 w-8 text-brand-burgundy" />
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
        </div>
        <p className="text-lg mb-6">Access legal references, precedents, and resources from our vector database.</p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2 max-w-lg">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        {/* Document List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-md">
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-4 w-1/3" />
                </CardFooter>
              </Card>
            ))
          ) : filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-burgundy" /> 
                    {doc.title || "Untitled Document"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> 
                    {formatDate(doc.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {doc.contents.length} content segments available
                  </p>
                  {doc.url && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        Source Link
                      </a>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="content">
                      <AccordionTrigger>View Content</AccordionTrigger>
                      <AccordionContent>
                        <div className="max-h-60 overflow-y-auto">
                          {doc.contents.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Page</TableHead>
                                  <TableHead>Content</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {doc.contents.map((content, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      {content.metadata?.location?.page || 'N/A'}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                      {content.content || 'No content available'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No content available for this document.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow-md">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-xl font-medium mb-1">No Documents Found</h3>
              <p className="text-center text-muted-foreground mb-4">
                {searchTerm ? 
                  "No documents match your search criteria." : 
                  "There are no documents in the knowledge base yet."}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Knowledge;
