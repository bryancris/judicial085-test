
import React, { useState } from 'react';
import { Book, AlertCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchGoogleScholar, ScholarlyArticle } from '@/utils/api/scholarApiService';
import { Badge } from '@/components/ui/badge';

const ScholarlyResearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ScholarlyArticle[]>([]);
  const [activeTab, setActiveTab] = useState<"relevance" | "recent" | "cited">("relevance");
  const [hasError, setHasError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress
  React.useEffect(() => {
    let interval: number;
    if (isSearching) {
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
  }, [isSearching]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasError(false);
    
    try {
      const { results, error } = await searchGoogleScholar(
        searchTerm,
        10,
        activeTab === "recent" ? "recent" : activeTab === "cited" ? "cited" : "relevance"
      );
      
      if (error) {
        console.error("Search error:", error);
        setHasError(true);
        setSearchResults([]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Search exception:", err);
      setHasError(true);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as "relevance" | "recent" | "cited");
    if (searchResults.length > 0) {
      // Re-search with new sort order if we already have results
      handleSearch();
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Book className="h-8 w-8 text-brand-burgundy" />
        <h2 className="text-2xl font-bold">Scholarly Legal Research</h2>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Legal Scholarship</CardTitle>
          <CardDescription>
            Find articles, legal journals, and academic research papers related to your case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search legal concepts, case law, or specific statutes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={!searchTerm.trim() || isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="relevance" 
            value={activeTab}
            onValueChange={handleTabChange}
            className="mt-6"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="relevance">By Relevance</TabsTrigger>
              <TabsTrigger value="recent">Most Recent</TabsTrigger>
              <TabsTrigger value="cited">Most Cited</TabsTrigger>
            </TabsList>
            
            {/* Loading Progress Bar */}
            {isSearching && (
              <div className="mb-6">
                <Progress value={loadingProgress} className="h-2" />
              </div>
            )}
            
            {/* Error state */}
            {hasError && !isSearching && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  An error occurred while searching. Please try again or refine your search terms.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Search results */}
            <div>
              {searchResults.length > 0 ? (
                <div className="space-y-6">
                  {searchResults.map((article, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        <a 
                          href={article.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-lg font-medium hover:text-blue-600 hover:underline"
                        >
                          {article.title}
                        </a>
                        
                        <p className="mt-2 text-sm text-muted-foreground">{article.snippet}</p>
                        
                        <div className="flex flex-wrap gap-x-4 mt-3">
                          {article.citation_info > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {article.citation_info} Citations
                            </Badge>
                          )}
                          {article.year && (
                            <Badge variant="outline">
                              Published: {article.year}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs text-gray-500 italic">{article.publication_info}</div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(article.link, "_blank")}
                          >
                            View Article
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchTerm && !isSearching ? (
                <div className="text-center py-12">
                  <Book className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No articles found</h3>
                  <p className="text-gray-500">Try different search terms or check your spelling</p>
                </div>
              ) : null}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScholarlyResearch;
