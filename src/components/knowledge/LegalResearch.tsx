import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { searchLegalResearch, savePerplexityResearch } from '@/utils/api/perplexityApiService';
import { useAuthState } from '@/hooks/useAuthState';
import { useToast } from '@/hooks/use-toast';

interface ResearchResult {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations: string[];
  searchType: string;
  query: string;
}

const LegalResearch = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuthState();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const { result: searchResult, error: searchError } = await searchLegalResearch(query);
      
      if (searchError) {
        setError(searchError);
        toast({
          title: "Search Error",
          description: searchError,
          variant: "destructive",
        });
        return;
      }

      if (searchResult) {
        setResult(searchResult);
        toast({
          title: "Research Complete",
          description: "Legal research results retrieved successfully",
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-6 w-6 text-brand-burgundy" />
        <h2 className="text-2xl font-bold">Legal Research</h2>
      </div>
      
      <p className="text-muted-foreground">
        Get real-time legal research with AI-powered analysis, citations, and current legal precedents.
      </p>

      {/* Search Interface */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Enter your legal research question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !query.trim()}
          className="bg-brand-burgundy hover:bg-brand-burgundy/90"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          {isSearching ? 'Researching...' : 'Research'}
        </Button>
      </div>

      {/* Alert for AI Research */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This research uses AI to analyze current legal databases, statutes, and case law. 
          Results include citations and should be verified for legal proceedings.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-brand-burgundy" />
                Research Results
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{result.model}</Badge>
                <Badge variant="outline">
                  {result.usage.total_tokens} tokens
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Research Content */}
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {result.content}
              </div>
            </div>

            {/* Citations */}
            {result.citations && result.citations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Sources & Citations</h4>
                <div className="space-y-2">
                  {result.citations.map((citation, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 mb-1">
                          Source {index + 1}
                        </div>
                        <div className="text-gray-600">
                          {citation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Info */}
            <div className="border-t pt-4">
              <div className="text-xs text-muted-foreground">
                <strong>Query:</strong> {result.query}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Search Type:</strong> {result.searchType}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isSearching && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-brand-burgundy animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium">Researching Legal Information</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing current legal databases and precedents...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && !isSearching && !error && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium">Ready for Legal Research</p>
                <p className="text-sm text-muted-foreground">
                  Enter a legal question above to get AI-powered research with citations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LegalResearch;