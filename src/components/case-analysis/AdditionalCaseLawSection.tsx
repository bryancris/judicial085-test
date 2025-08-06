import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { invokeFunction } from '@/utils/api/baseApiService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LawReferenceLink from '@/components/knowledge/LawReferenceLink';

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
  timeout?: boolean;
  error?: string;
}

export const AdditionalCaseLawSection: React.FC<AdditionalCaseLawProps> = ({
  analysisData,
  clientId,
  caseType
}) => {
  const [cases, setCases] = useState<PerplexityCase[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to show loading state while fetching
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing additional case law on component mount
  useEffect(() => {
    const loadExistingCases = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for existing saved additional case law
        const { data: existingCases, error } = await supabase
          .from('additional_case_law' as any)
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading existing cases:', error);
          setIsLoading(false);
          return;
        }

        if (existingCases && existingCases.length > 0) {
          // Convert database format to component format
          const formattedCases: PerplexityCase[] = existingCases.map((dbCase: any) => ({
            caseName: dbCase.case_name,
            court: dbCase.court || "Court information not available",
            citation: dbCase.citation || "Citation pending",
            date: dbCase.date_decided || "Date not available",
            relevantFacts: dbCase.relevant_facts || "",
            outcome: dbCase.outcome || "",
            url: dbCase.url || undefined
          }));

          setCases(formattedCases);
          setHasSearched(true);
          setLastUpdated(new Date((existingCases as any)[0]?.created_at || Date.now()).toLocaleDateString());
        }
      } catch (error) {
        console.error('Error loading existing cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingCases();
  }, [clientId]);

  // Function to save new cases to the database
  const saveNewCasesToDatabase = async (newCases: PerplexityCase[], clientId: string) => {
    try {
      // First, clear existing cases for this client to avoid duplicates
      await supabase
        .from('additional_case_law' as any)
        .delete()
        .eq('client_id', clientId);

      // Insert new cases
      const casesToInsert = newCases.map(caseItem => ({
        client_id: clientId,
        case_name: caseItem.caseName,
        court: caseItem.court,
        citation: caseItem.citation,
        date_decided: caseItem.date,
        relevant_facts: caseItem.relevantFacts,
        outcome: caseItem.outcome,
        url: caseItem.url
      }));

      const { error } = await supabase
        .from('additional_case_law' as any)
        .insert(casesToInsert);

      if (error) {
        console.error('Error saving cases to database:', error);
      } else {
        console.log('Successfully saved', newCases.length, 'cases to database');
      }
    } catch (error) {
      console.error('Error in saveNewCasesToDatabase:', error);
    }
  };

  // Extract legal concepts from preliminary analysis
  const extractLegalConcepts = (analysisData: any) => {
    const concepts = {
      contractTerms: [] as string[],
      legalIssues: [] as string[],
      statutes: [] as string[],
      jurisdiction: 'Texas',
      caseType: 'contract'
    };

    const analysisText = (analysisData?.summary || analysisData?.preliminaryAnalysis || '').toLowerCase();
    
    // Detect contract-related terms
    const contractTerms = [
      'breach of contract', 'express warranty', 'implied warranty', 'construction contract',
      'home renovation', 'material substitution', 'contractual obligations',
      'performance', 'damages', 'remedies', 'consideration'
    ];
    
    // Detect specific legal issues
    const legalIssues = [
      'warranty breach', 'material breach', 'substantial performance',
      'construction defects', 'consumer protection', 'deceptive trade practices'
    ];
    
    // Detect Texas statutes
    const statutePatterns = [
      'property code', 'business.*commerce code', 'dtpa', 'deceptive trade practices'
    ];
    
    contractTerms.forEach(term => {
      if (analysisText.includes(term)) {
        concepts.contractTerms.push(term);
      }
    });
    
    legalIssues.forEach(issue => {
      if (analysisText.includes(issue)) {
        concepts.legalIssues.push(issue);
      }
    });
    
    statutePatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(analysisText)) {
        concepts.statutes.push(pattern.replace('.*', ' & '));
      }
    });
    
    return concepts;
  };

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

      // Extract legal concepts from preliminary analysis
      const concepts = extractLegalConcepts(analysisData);
      
      // Build enhanced search query with specific legal concepts
      let searchQuery = '';
      if (concepts.contractTerms.length > 0 || concepts.legalIssues.length > 0) {
        const combinedTerms = [...concepts.contractTerms, ...concepts.legalIssues].join(' OR ');
        searchQuery = `Texas construction contract and warranty cases involving: ${combinedTerms}`;
        
        if (concepts.statutes.length > 0) {
          searchQuery += ` AND ${concepts.statutes.join(' OR ')}`;
        }
      } else {
        // Fallback to original logic
        searchQuery = analysisData?.summary 
          ? `Find additional legal cases similar to: ${analysisData.summary.substring(0, 500)}`
          : `Find legal cases related to ${caseType} law`;
      }

      // Prepare enhanced context with legal concepts
      const enhancedContext = [
        ...(analysisData?.keyFacts || []),
        ...concepts.contractTerms,
        ...concepts.legalIssues,
        'Texas jurisdiction',
        'construction law',
        'contract law',
        'warranty law'
      ].join(', ');

      console.log('=== Calling perplexity-research ===');
      console.log('Parameters:', {
        query: searchQuery.substring(0, 100) + '...',
        searchType: 'legal-research', // Changed to legal-research for better case law
        context: enhancedContext.substring(0, 100) + '...',
        limit: 5,
        concepts: concepts
      });

      // Try the function call with detailed error logging
      const { data, error: functionError } = await invokeFunction('perplexity-research', {
        query: searchQuery,
        searchType: 'legal-research', // Use legal-research for more comprehensive results
        context: enhancedContext,
        limit: 5,
        concepts: concepts
      });

      console.log('=== Function Response ===');
      console.log('Data:', data);
      console.log('Error:', functionError);
      console.log('Full response object keys:', data ? Object.keys(data) : 'No data');

      if (functionError) {
        // Handle specific timeout errors
        if (functionError.includes('timeout') || functionError.includes('504') || functionError.includes('Request timeout')) {
          toast({
            title: "Search Timed Out",
            description: "The search took too long. Please try again with a simpler query or wait a moment before retrying.",
            variant: "destructive",
          });
          setError("The search took too long and was cancelled. This can happen with complex queries. Try again or simplify your search.");
          return;
        }
        
        throw new Error(functionError);
      }

      // Check if the response indicates a timeout
      const result = data as PerplexityResult;
      if (result?.timeout || result?.error === 'Request timeout') {
        toast({
          title: "Search Timed Out",
          description: "The search took too long. Please try again with a simpler query.",
          variant: "destructive",
        });
        setError("The search took too long and was cancelled. This can happen with complex queries. Try again or simplify your search.");
        return;
      }
      if (result?.content) {
        let newCases: PerplexityCase[] = [];
        
        try {
          // Try to parse as JSON first (for similar-cases search type)
          const parsedCases = JSON.parse(result.content);
          if (Array.isArray(parsedCases)) {
            newCases = parsedCases.slice(0, 5); // Limit to 5 cases
          } else {
            throw new Error('Invalid JSON format');
          }
        } catch (parseError) {
          // If JSON parsing fails, it might be text content with citations
          // Extract case information from text
          newCases = extractCasesFromText(result.content, result.citations || []);
        }

        // Save the new cases to the database
        if (newCases.length > 0 && clientId) {
          await saveNewCasesToDatabase(newCases, clientId);
        }

        setCases(newCases);
        setLastUpdated(new Date().toLocaleDateString());
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
                        <span className="font-medium">Citation:</span> <LawReferenceLink citation={caseItem.citation} url={caseItem.url} />
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
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <p>Results powered by comprehensive legal database search. Click refresh to search again with updated criteria.</p>
              {lastUpdated && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Last updated: {lastUpdated}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};