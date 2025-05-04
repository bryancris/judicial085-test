
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import SearchBar from '@/components/knowledge/SearchBar';
import DocumentList from '@/components/knowledge/DocumentList';
import { useDocuments } from '@/hooks/useDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Knowledge = () => {
  const [hasError, setHasError] = useState(false);
  
  const {
    session,
    loading,
    documents,
    searchTerm,
    setSearchTerm,
    isSearching,
    handleSearch,
    clearSearch,
    loadMore,
    hasMore,
    isLoadingMore,
    hasError: documentsError,
    initialFetchAttempted
  } = useDocuments();

  // Track errors from the hook
  useEffect(() => {
    if (documentsError) {
      setHasError(true);
    }
  }, [documentsError]);

  // Log component state for debugging
  console.log("Knowledge page render:", {
    hasSession: !!session,
    loading,
    documentsCount: documents.length,
    hasError,
    initialFetchAttempted
  });

  // If not authenticated, redirect to auth page
  if (initialFetchAttempted && !loading && !session) {
    console.log("Not authenticated, redirecting to auth page");
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
        
        {hasError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error loading the knowledge base. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Search Bar */}
        <SearchBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isSearching={isSearching}
          handleSearch={handleSearch}
        />

        {/* Initial loading state */}
        {loading && !documents.length && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-brand-burgundy animate-spin mb-4" />
            <p className="text-lg">Loading knowledge base...</p>
          </div>
        )}

        {/* Document List with pagination */}
        {(documents.length > 0 || !loading) && (
          <DocumentList 
            loading={loading}
            documents={documents}
            searchTerm={searchTerm}
            clearSearch={clearSearch}
            loadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            hasError={documentsError}
          />
        )}
      </main>
    </div>
  );
};

export default Knowledge;
