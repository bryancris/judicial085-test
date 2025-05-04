
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { BookOpen, AlertCircle } from 'lucide-react';
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
    hasError: documentsError
  } = useDocuments();

  // Track errors from the hook
  useEffect(() => {
    if (documentsError) {
      setHasError(true);
    }
  }, [documentsError]);

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

        {/* Document List with pagination */}
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
      </main>
    </div>
  );
};

export default Knowledge;
