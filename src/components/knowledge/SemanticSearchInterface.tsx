import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SemanticSearchResult {
  id: string;
  courtlistener_id: string;
  case_name: string;
  court: string;
  court_name: string;
  citation: string;
  date_filed: string;
  date_decided: string;
  snippet: string;
  absolute_url: string;
  jurisdiction: string;
  case_type: string;
  precedential_status: string;
  similarity: number;
  text_rank?: number;
  combined_score?: number;
}

export function SemanticSearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'hybrid'>('semantic');
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (mode: 'semantic' | 'hybrid') => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase.functions.invoke(
        'semantic-search',
        {
          body: {
            query: query.trim(),
            searchMode: mode,
            matchThreshold: mode === 'semantic' ? 0.6 : 0.5,
            matchCount: 15,
            semanticWeight: 0.7
          }
        }
      );

      if (searchError) throw searchError;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setResults(data?.results || []);
      
      if (data?.warning) {
        setError(`Warning: ${data.warning}`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchMode);
  };

  const formatSimilarity = (similarity: number) => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Semantic Case Search
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Search legal cases using AI-powered semantic understanding
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your legal query or case description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={searchMode === 'semantic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('semantic')}
            >
              Semantic Only
            </Button>
            <Button
              variant={searchMode === 'hybrid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchMode('hybrid')}
            >
              Hybrid (Semantic + Text)
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Search Results ({results.length} cases found)
          </h3>
          
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Header with case name and similarity */}
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-lg leading-tight">
                      {result.case_name}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {searchMode === 'hybrid' && result.combined_score && (
                        <Badge variant="secondary">
                          Score: {(result.combined_score * 100).toFixed(1)}%
                        </Badge>
                      )}
                      <Badge variant="default">
                        {formatSimilarity(result.similarity)} match
                      </Badge>
                    </div>
                  </div>

                  {/* Court and citation info */}
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {result.court_name && (
                      <span className="bg-muted px-2 py-1 rounded">
                        {result.court_name}
                      </span>
                    )}
                    {result.citation && (
                      <span className="bg-muted px-2 py-1 rounded">
                        {result.citation}
                      </span>
                    )}
                    {result.date_decided && (
                      <span className="bg-muted px-2 py-1 rounded">
                        Decided: {formatDate(result.date_decided)}
                      </span>
                    )}
                  </div>

                  {/* Case snippet */}
                  {result.snippet && (
                    <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                      {result.snippet}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2">
                    {result.jurisdiction && (
                      <Badge variant="outline">{result.jurisdiction}</Badge>
                    )}
                    {result.case_type && (
                      <Badge variant="outline">{result.case_type}</Badge>
                    )}
                    {result.precedential_status && (
                      <Badge variant="outline">{result.precedential_status}</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  {result.absolute_url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={result.absolute_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Full Case
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !isLoading && query && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No cases found matching your search query.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}