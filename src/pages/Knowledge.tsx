
import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import { BookOpen, AlertCircle, Loader2, Database, Book } from 'lucide-react';
import SearchBar from '@/components/knowledge/SearchBar';
import DocumentList from '@/components/knowledge/DocumentList';
import { useDocuments } from '@/hooks/useDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScholarlyResearch from '@/components/knowledge/ScholarlyResearch';

const Knowledge = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "scholarly">("documents");
  
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

  // Simulate loading progress
  React.useEffect(() => {
    let interval: number;
    if (loading) {
      setLoadingProgress(0);
      interval = window.setInterval(() => {
        setLoadingProgress(prev => {
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

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  // Log data for debugging
  console.log("Knowledge page rendering with", {
    docsCount: documents.length,
    loading,
    initialFetchAttempted
  });

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-brand-burgundy" />
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleDebugMode}
            >
              {debugMode ? "Hide Debug" : "Debug Mode"}
            </Button>
          </div>
        </div>
        
        <p className="text-lg mb-6">Access legal references, precedents, resources, and scholarly articles.</p>
        
        {debugMode && (
          <Alert className="mb-6 bg-gray-100">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div>Documents: {documents.length}</div>
              <div>Loading: {loading ? "True" : "False"}</div>
              <div>Auth: {session ? "Authenticated" : "Not Authenticated"}</div>
              <div>Initial Fetch: {initialFetchAttempted ? "Done" : "Pending"}</div>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "documents" | "scholarly")}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Legal Documents
            </TabsTrigger>
            <TabsTrigger value="scholarly" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              Scholarly Research
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="mt-6">
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
              </div>
            )}

            {/* Document List */}
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
                  There are no documents available in the knowledge base.
                </p>
                {debugMode && (
                  <div className="mt-4 p-2 bg-gray-200 rounded text-xs font-mono text-left">
                    <p>Status: Initial fetch completed without documents</p>
                    <p>Auth status: {session ? "Authenticated" : "Not authenticated"}</p>
                    <p>Try running this SQL in Supabase:</p>
                    <pre className="overflow-x-auto p-2 bg-gray-300 mt-2">
                      SELECT * FROM documents LIMIT 5;
                    </pre>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="scholarly" className="mt-6">
            <ScholarlyResearch />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Knowledge;
