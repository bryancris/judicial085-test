import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { searchLegalResearch, savePerplexityResearch, loadPerplexityResearch, PerplexitySearchResult } from "@/utils/api/perplexityApiService";
import { useToast } from "@/hooks/use-toast";

interface LegalResearchTabProps {
  clientId: string;
  caseId?: string;
  currentAnalysisId?: string;
}

const LegalResearchTab: React.FC<LegalResearchTabProps> = ({ 
  clientId, 
  caseId,
  currentAnalysisId 
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentResult, setCurrentResult] = useState<PerplexitySearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load research history on component mount
  useEffect(() => {
    loadResearchHistory();
  }, [clientId, currentAnalysisId]);

  const loadResearchHistory = async () => {
    if (!currentAnalysisId) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const { results, error } = await loadPerplexityResearch(
        clientId, 
        currentAnalysisId,
        'legal-research'
      );
      
      if (error) {
        console.error("Error loading research history:", error);
      } else {
        setSearchHistory(results);
      }
    } catch (err) {
      console.error("Exception loading research history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const { result, error } = await searchLegalResearch(query);

      if (error) {
        setError(error);
        toast({
          title: "Research Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      if (result) {
        setCurrentResult(result);
        
        // Save research to database if we have an analysis ID
        if (currentAnalysisId) {
          const { success, error: saveError } = await savePerplexityResearch(
            clientId,
            currentAnalysisId,
            result,
            'legal-research'
          );

          if (success) {
            // Refresh history to show the new research
            loadResearchHistory();
            toast({
              title: "Research Complete",
              description: "Legal research has been completed and saved.",
            });
          } else if (saveError) {
            console.error("Failed to save research:", saveError);
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast({
        title: "Research Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const formatCitations = (citations: string[]) => {
    return citations.map((citation, index) => (
      <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
        <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <span className="break-all">{citation}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Legal Research
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Search for legal precedents, statutes, case law, and legal analysis relevant to your case. 
              Research results will be saved to your case file.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Input
              placeholder="Enter your legal research question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !query.trim()}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? "Researching..." : "Research"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Research Result */}
      {currentResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Research Results</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentResult.model}</Badge>
                <Badge variant="outline" className="text-xs">
                  {currentResult.usage.total_tokens} tokens
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-64">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{currentResult.content}</p>
              </div>
            </ScrollArea>

            {currentResult.citations && currentResult.citations.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">Sources & Citations</h4>
                  <div className="space-y-2">
                    {formatCitations(currentResult.citations)}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Research History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Research History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading research history...</div>
            </div>
          ) : searchHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No research history yet. Start by searching above.</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {searchHistory.map((research, index) => (
                  <div key={research.id || index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{research.query}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {research.model}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(research.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {research.content}
                    </p>
                    {research.citations && research.citations.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {research.citations.length} source{research.citations.length !== 1 ? 's' : ''} cited
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalResearchTab;