import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { invokeFunction } from '@/utils/api/baseApiService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdditionalCaseLawProps {
  analysisData?: any;
  clientId?: string;
  caseType?: string;
}

interface PerplexityCase {
  caseName: string;
  court: string;
  citation: string;
  date: string;
  relevantFacts: string;
  outcome: string;
  url?: string;
}

interface PerplexityResult {
  content: string;
  citations: string[];
  model: string;
}

export const AdditionalCaseLawSection: React.FC<AdditionalCaseLawProps> = ({
  analysisData,
  clientId,
  caseType
}) => {
  const [cases, setCases] = useState<PerplexityCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const searchAdditionalCases = async () => {
    if (!analysisData?.summary && !caseType) {
      toast({
        title: "Search Not Available",
        description: "Analysis data is required to search for additional cases.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check authentication status first
      console.log('=== Authentication Check ===');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session status:', { 
        hasSession: !!session, 
        sessionError,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
      });

      // Refresh session if needed
      if (!session) {
        console.log('No session found, attempting to refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        console.log('Session refresh result:', { 
          hasRefreshedSession: !!refreshedSession, 
          refreshError 
        });
        
        if (!refreshedSession && refreshError) {
          throw new Error('Authentication required. Please log in again.');
        }
      }

      // Create search query from analysis data
      const searchQuery = analysisData?.summary 
        ? `Find additional legal cases similar to: ${analysisData.summary.substring(0, 500)}`
        : `Find legal cases related to ${caseType} law`;

      console.log('=== Calling perplexity-research ===');
      console.log('Parameters:', {
        query: searchQuery.substring(0, 100) + '...',
        searchType: 'similar-cases',
        context: (analysisData?.keyFacts?.join(', ') || '').substring(0, 100) + '...',
        limit: 5
      });

      // Try the function call with detailed error logging
      const { data, error: functionError } = await invokeFunction('perplexity-research', {
        query: searchQuery,
        searchType: 'similar-cases',
        context: analysisData?.keyFacts?.join(', ') || '',
        limit: 5
      });

      console.log('=== Function Response ===');
      console.log('Data:', data);
      console.log('Error:', functionError);
      console.log('Full response object keys:', data ? Object.keys(data) : 'No data');

      if (functionError) {
        throw new Error(functionError);
      }

      const result = data as PerplexityResult;
      if (result?.content) {
        try {
          // Try to parse as JSON first (for similar-cases search type)
          const parsedCases = JSON.parse(result.content);
          if (Array.isArray(parsedCases)) {
            setCases(parsedCases.slice(0, 5)); // Limit to 5 cases
          } else {
            throw new Error('Invalid JSON format');
          }
        } catch (parseError) {
          // If JSON parsing fails, it might be text content with citations
          // Extract case information from text
          const extractedCases = extractCasesFromText(result.content, result.citations || []);
          setCases(extractedCases);
        }
      }

      setHasSearched(true);
      toast({
        title: "Additional Cases Found",
        description: `Found ${cases.length} additional cases from legal databases.`,
      });

    } catch (error: any) {
      console.error('Error searching additional cases:', error);
      setError(error.message || 'Failed to search for additional cases');
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for additional cases.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractCasesFromText = (content: string, citations: string[]): PerplexityCase[] => {
    const cases: PerplexityCase[] = [];
    
    // Simple extraction logic - look for case patterns in the content
    const casePatterns = [
      /([A-Z][a-zA-Z\s&]+v\.\s+[A-Z][a-zA-Z\s&]+)/g,
      /([A-Z][a-zA-Z\s&]+vs\.\s+[A-Z][a-zA-Z\s&]+)/g
    ];

    casePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match, index) => {
          if (cases.length < 3) { // Limit to 3 cases from text
            cases.push({
              caseName: match,
              court: "Court information not available",
              citation: citations[index] || "Citation pending",
              date: "Date not available",
              relevantFacts: "Relevant facts extracted from comprehensive legal research",
              outcome: "Outcome details available in full research",
              url: citations[index]?.includes('http') ? citations[index] : undefined
            });
          }
        });
      }
    });

    return cases;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
          Additional Case Law
          {caseType && (
            <Badge variant="outline" className="ml-2">
              {caseType}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={searchAdditionalCases}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {hasSearched ? 'Refresh' : 'Search Cases'}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md mb-4">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Searching legal databases...</span>
            </div>
          </div>
        )}

        {!isLoading && !hasSearched && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              Click "Search Cases" to find additional relevant case law from comprehensive legal databases.
            </p>
          </div>
        )}

        {!isLoading && hasSearched && cases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No additional cases found in this search.</p>
          </div>
        )}

        {cases.length > 0 && (
          <div className="space-y-4">
            {cases.map((caseItem, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{caseItem.caseName}</h4>
                      {caseItem.url && (
                        <a
                          href={caseItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Court:</span> {caseItem.court}
                      </div>
                      <div>
                        <span className="font-medium">Citation:</span> {caseItem.citation}
                      </div>
                      {caseItem.date && (
                        <div>
                          <span className="font-medium">Date:</span> {caseItem.date}
                        </div>
                      )}
                    </div>

                    {caseItem.relevantFacts && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Relevant Facts:</span>
                        <p className="mt-1 text-foreground">{caseItem.relevantFacts}</p>
                      </div>
                    )}

                    {caseItem.outcome && (
                      <div className="text-xs">
                        <span className="font-medium text-muted-foreground">Outcome:</span>
                        <p className="mt-1 text-foreground">{caseItem.outcome}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSearched && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Results powered by comprehensive legal database search. Click refresh to search again with updated criteria.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};