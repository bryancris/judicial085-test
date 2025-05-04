
import React, { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import { BookOpen, AlertCircle, Loader2, Database } from 'lucide-react';
import SearchBar from '@/components/knowledge/SearchBar';
import DocumentList from '@/components/knowledge/DocumentList';
import { useDocuments } from '@/hooks/useDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const Knowledge = () => {
  const [hasError, setHasError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  
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

  // Simulate loading progress
  useEffect(() => {
    let interval: number;
    if (loading) {
      setLoadingProgress(0);
      interval = window.setInterval(() => {
        setLoadingProgress(prev => {
          // Max out at 90% until actually loaded
          const newProgress = prev + (90 - prev) * 0.1;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
    } else {
      setLoadingProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  // Log component state for debugging
  console.log("Knowledge page render:", {
    hasSession: !!session,
    loading,
    documentsCount: documents.length,
    hasError,
    initialFetchAttempted,
    loadingProgress
  });

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-brand-burgundy" />
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleDebugMode}
            className="text-xs"
          >
            {debugMode ? "Hide Debug" : "Debug Mode"}
          </Button>
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
        
        {debugMode && (
          <Alert className="mb-6 bg-gray-100">
            <Database className="h-4 w-4" />
            <AlertDescription className="font-mono text-xs">
              <div>Auth: {session ? "Authenticated" : "Not Authenticated"}</div>
              <div>Loading: {loading ? "True" : "False"}</div>
              <div>Documents Count: {documents.length}</div>
              <div>Initial Fetch: {initialFetchAttempted ? "Attempted" : "Not Attempted"}</div>
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

        {/* Loading Progress Bar */}
        {loading && (
          <div className="mb-6">
            <Progress value={loadingProgress} className="h-2" />
          </div>
        )}

        {/* Initial loading state */}
        {loading && !documents.length && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-brand-burgundy animate-spin mb-4" />
            <p className="text-lg">Loading knowledge base...</p>
            <p className="text-sm text-gray-500 mt-2">This might take a few moments</p>
          </div>
        )}

        {/* Document List with pagination */}
        {(!loading || documents.length > 0) && (
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

        {!loading && initialFetchAttempted && documents.length === 0 && !searchTerm && (
          <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-xl font-medium">No Documents Available</h3>
            <p className="text-gray-600 mt-2">
              There are no documents available in the knowledge base or you may not have permission to view them.
            </p>
            {debugMode && (
              <div className="mt-4 p-2 bg-gray-200 rounded text-xs font-mono text-left">
                <p>Status: Initial fetch completed without documents</p>
                <p>Auth status: {session ? "Authenticated" : "Not authenticated"}</p>
                <p>If documents exist but aren't showing, check:</p>
                <ul className="list-disc pl-5">
                  <li>Database connection status</li>
                  <li>Row Level Security (RLS) policies</li>
                  <li>Table permissions</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Knowledge;
