import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface AICoordinatorResponse {
  success: boolean;
  content: string;
  citations: string[];
  sources: any[];
  error?: string;
}

interface AdaptiveSearchResponse {
  similarCases: any[];
  searchMetadata?: {
    context?: {
      area_of_law?: string;
    };
    filtering?: {
      total_candidates?: number;
      avg_relevance?: string;
    };
  };
  fallbackUsed?: boolean;
  analysisFound?: boolean;
  searchStrategy?: string;
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
  const [autoSearchAttempted, setAutoSearchAttempted] = useState(false);
  const { toast } = useToast();

  // Load existing additional case law on component mount and auto-search if analysis available
  useEffect(() => {
    const loadExistingCases = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for existing saved additional case law
        let query = supabase
          .from('additional_case_law' as any)
          .select('*')
          .eq('client_id', clientId);

        if (analysisData?.id) {
          query = query.eq('legal_analysis_id', analysisData.id);
        }

        const { data: existingCases, error } = await query
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
        } else {
          // No existing cases found, auto-search if analysis data is available
          if ((analysisData?.content || analysisData?.summary || caseType) && !autoSearchAttempted) {
            console.log('No existing additional case law found, auto-searching...');
            setAutoSearchAttempted(true);
            searchAdditionalCases();
          }
        }
      } catch (error) {
        console.error('Error loading existing cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingCases();
  }, [clientId]);

  // Auto-search when analysis data becomes available
  useEffect(() => {
    if ((analysisData?.content || analysisData?.summary) && !hasSearched && cases.length === 0 && !autoSearchAttempted) {
      console.log('Analysis data available, auto-searching for additional case law...');
      setAutoSearchAttempted(true);
      searchAdditionalCases();
    }
  }, [analysisData, hasSearched, cases.length, autoSearchAttempted]);

  // Function to save new cases to the database
  const saveNewCasesToDatabase = async (
    newCases: PerplexityCase[], 
    clientId: string,
    legalAnalysisId?: string
  ) => {
    try {
      // First, clear existing cases for this client/analysis to avoid duplicates
      let del = supabase
        .from('additional_case_law' as any)
        .delete()
        .eq('client_id', clientId);
      if (legalAnalysisId) {
        del = del.eq('legal_analysis_id', legalAnalysisId);
      }
      await del;

      // Insert new cases (if any)
      const casesToInsert = newCases.map(caseItem => ({
        client_id: clientId,
        legal_analysis_id: legalAnalysisId || null,
        case_name: caseItem.caseName,
        court: caseItem.court,
        citation: caseItem.citation,
        date_decided: caseItem.date,
        relevant_facts: caseItem.relevantFacts,
        outcome: caseItem.outcome,
        url: caseItem.url
      }));

      if (casesToInsert.length > 0) {
        const { error } = await supabase
          .from('additional_case_law' as any)
          .insert(casesToInsert);

        if (error) {
          console.error('Error saving cases to database:', error);
        } else {
          console.log('Successfully saved', newCases.length, 'cases to database');
        }
      } else {
        console.log('No new cases to insert; cleared stale entries for this analysis.');
      }
    } catch (error) {
      console.error('Error in saveNewCasesToDatabase:', error);
    }
  };

  // Generate adaptive Perplexity search query based on case analysis
  const buildAdaptivePerplexityQuery = async (clientId: string) => {
    try {
      console.log('=== Running adaptive case analysis ===');
      
      // Call the adaptive case analyzer
      const { data: analysisResp, error: analysisError } = await supabase.functions.invoke('search-similar-cases', {
        body: { clientId, action: 'analyze-only' }
      });

      if (analysisError) {
        console.warn('Adaptive analysis failed, using fallback:', analysisError);
        throw new Error('Analysis service unavailable');
      }

      const caseAnalysis = analysisResp?.analysis;
      if (!caseAnalysis || caseAnalysis.confidence < 0.3) {
        console.log('Low confidence analysis, using fallback approach');
        throw new Error('Low confidence analysis');
      }

      console.log('Adaptive analysis successful:', caseAnalysis);

      // Build targeted query based on legal area and concepts
      const legalArea = caseAnalysis.primaryLegalArea || 'general-legal-matter';
      const concepts = caseAnalysis.legalConcepts || [];
      const statutes = caseAnalysis.relevantStatutes || [];
      const searchTerms = caseAnalysis.searchTerms || [];

      // Build focused Perplexity query
      let query = `Find Texas civil court cases related to ${legalArea.replace(/-/g, ' ')}`;
      
      if (concepts.length > 0) {
        query += ` involving: ${concepts.join(', ')}`;
      }
      
      if (statutes.length > 0) {
        query += ` with statutes: ${statutes.join(', ')}`;
      }
      
      query += ' in Texas';
      
      if (searchTerms.length > 0) {
        const factualContext = searchTerms.filter(term => 
          !term.toLowerCase().includes('texas') && 
          !concepts.some(concept => term.toLowerCase().includes(concept.toLowerCase()))
        ).slice(0, 3);
        
        if (factualContext.length > 0) {
          query += `. Facts: ${factualContext.join(', ')}`;
        }
      }
      
      query += '. Focus on precedential cases with similar legal issues.';

      return {
        query,
        searchType: 'legal-research',
        analysisMetadata: caseAnalysis
      };

    } catch (error) {
      console.log('Using fallback query approach:', error);
      // Fallback to simple text-based query
      const analysisText = (analysisData?.content || analysisData?.summary || caseType || '').slice(0, 1000);
      return {
        query: `Find legal cases relevant to ${caseType || 'this matter'}. Facts: ${analysisText}. Focus on precedential Texas cases when applicable.`,
        searchType: 'current-research',
        analysisMetadata: null
      };
    }
  };

  const searchAdditionalCases = async () => {
    if (!clientId) {
      toast({
        title: "Search Not Available",
        description: "Client ID is required to search for additional cases.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('=== Additional Case Law: Starting adaptive search ===');
      
      // Get adaptive query based on case analysis
      const { query, searchType, analysisMetadata } = await buildAdaptivePerplexityQuery(clientId);
      
      console.log('Using query:', query.substring(0, 200) + '...');
      console.log('Search type:', searchType);

      const { data: resp, error: fxError } = await supabase.functions.invoke('perplexity-research', {
        body: {
          query,
          clientId,
          searchType,
          requestContext: 'additional-case-law',
          limit: 10
        }
      });

      if (fxError) {
        throw new Error(fxError.message || fxError);
      }

      const content = (resp as any)?.content || '';
      const citations = (resp as any)?.citations || [];

      console.log('Perplexity response received, extracting cases...');
      let newCases: PerplexityCase[] = extractCasesFromText(content, citations);

      // Apply post-filtering based on analysis metadata
      if (analysisMetadata && newCases.length > 0) {
        console.log('Applying adaptive filtering...');
        newCases = filterRelevantCases(newCases, analysisMetadata);
      }

      if (clientId) {
        await saveNewCasesToDatabase(newCases, clientId, analysisData?.id);
      }

      setCases(newCases);
      setLastUpdated(new Date().toLocaleDateString());
      setHasSearched(true);

      if (newCases.length > 0) {
        toast({
          title: "Additional Cases Found",
          description: `Found ${newCases.length} relevant cases using adaptive search.`,
        });
      } else {
        // Clear any stale results for this specific analysis so old cases don't linger
        if (clientId && analysisData?.id) {
          await supabase
            .from('additional_case_law' as any)
            .delete()
            .eq('client_id', clientId)
            .eq('legal_analysis_id', analysisData.id);
        }
        toast({
          title: "No Additional Cases Found",
          description: "No high-confidence cases found for this analysis. Try refining the case description.",
        });
      }

    } catch (error: any) {
      console.error('Error in adaptive Perplexity case search:', error);
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

  // Filter cases based on analysis metadata to ensure relevance
  const filterRelevantCases = (cases: PerplexityCase[], analysisMetadata: any): PerplexityCase[] => {
    const legalConcepts = analysisMetadata.legalConcepts || [];
    const primaryArea = analysisMetadata.primaryLegalArea || '';
    
    return cases.filter(caseItem => {
      // Exclude criminal cases
      const caseText = `${caseItem.caseName} ${caseItem.relevantFacts} ${caseItem.outcome}`.toLowerCase();
      const criminalKeywords = ['state of texas v', 'indictment', 'criminal', 'dwi', 'dui', 'theft', 'assault', 'murder'];
      
      if (criminalKeywords.some(keyword => caseText.includes(keyword))) {
        console.log(`Filtered out criminal case: ${caseItem.caseName}`);
        return false;
      }

      // Require at least one legal concept match for focused areas
      if (legalConcepts.length > 0 && primaryArea !== 'general-legal-matter') {
        const hasConceptMatch = legalConcepts.some(concept => 
          caseText.includes(concept.toLowerCase())
        );
        
        if (!hasConceptMatch) {
          console.log(`Filtered out irrelevant case: ${caseItem.caseName}`);
          return false;
        }
      }

      return true;
    });
  };

  const parseAICoordinatorResponse = (content: string, citations: string[], sources: any[]): PerplexityCase[] => {
    const cases: PerplexityCase[] = [];
    
    // First, try to extract verified CourtListener cases from sources
    if (sources && sources.length > 0) {
      sources.forEach((source: any) => {
        if (source.case_name && source.court_name) {
          cases.push({
            caseName: source.case_name,
            court: source.court_name || source.court || "Court information available",
            citation: source.citation || extractCitationFromContent(content, source.case_name),
            date: source.date_filed || source.date_decided || extractDateFromContent(content, source.case_name),
            relevantFacts: extractRelevantFacts(content, source.case_name),
            outcome: extractOutcome(content, source.case_name),
            url: source.absolute_url ? `https://www.courtlistener.com${source.absolute_url}` : undefined
          });
        }
      });
    }
    
    // If no verified cases, extract from content using enhanced parsing
    if (cases.length === 0) {
      cases.push(...extractCasesFromText(content, citations));
    }
    
    return cases.slice(0, 5); // Limit to 5 cases
  };

  const extractCitationFromContent = (content: string, caseName: string): string => {
    // Look for citation patterns near the case name
    const caseIndex = content.indexOf(caseName);
    if (caseIndex !== -1) {
      const contextArea = content.substring(Math.max(0, caseIndex - 100), caseIndex + caseName.length + 100);
      const citationPatterns = [
        /\d+\s+[A-Z][a-z]*\.?\s*\d*d?\s+\d+/g, // e.g., "123 F.3d 456"
        /\d+\s+S\.W\.\d*d?\s+\d+/g, // e.g., "123 S.W.3d 456"
        /\d+\s+Tex\.\s*App\.\s*\d+/g // e.g., "123 Tex. App. 456"
      ];
      
      for (const pattern of citationPatterns) {
        const matches = contextArea.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0];
        }
      }
    }
    return "Citation available in full research";
  };

  const extractDateFromContent = (content: string, caseName: string): string => {
    // Look for date patterns near the case name
    const caseIndex = content.indexOf(caseName);
    if (caseIndex !== -1) {
      const contextArea = content.substring(Math.max(0, caseIndex - 100), caseIndex + caseName.length + 200);
      const datePatterns = [
        /\b\d{4}\b/g, // Year
        /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g
      ];
      
      for (const pattern of datePatterns) {
        const matches = contextArea.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0];
        }
      }
    }
    return "Date available in research";
  };

  const extractRelevantFacts = (content: string, caseName: string): string => {
    // Extract 1-2 sentences around the case name that describe relevant facts
    const caseIndex = content.indexOf(caseName);
    if (caseIndex !== -1) {
      // Get context around the case name
      const start = Math.max(0, caseIndex - 200);
      const end = Math.min(content.length, caseIndex + caseName.length + 300);
      const contextArea = content.substring(start, end);
      
      // Split into sentences and find relevant ones
      const sentences = contextArea.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const relevantSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes('contract') ||
        sentence.toLowerCase().includes('breach') ||
        sentence.toLowerCase().includes('warranty') ||
        sentence.toLowerCase().includes('construction') ||
        sentence.toLowerCase().includes('material') ||
        sentence.toLowerCase().includes('damage')
      );
      
      if (relevantSentences.length > 0) {
        return relevantSentences.slice(0, 2).join('. ').trim() + '.';
      }
      
      // Fallback to first meaningful sentence
      return sentences[0]?.trim() + '.' || "Relevant facts available in full research";
    }
    return "Case facts extracted from AI legal analysis";
  };

  const extractOutcome = (content: string, caseName: string): string => {
    // Look for outcome-related keywords near the case name
    const caseIndex = content.indexOf(caseName);
    if (caseIndex !== -1) {
      const contextArea = content.substring(caseIndex, Math.min(content.length, caseIndex + caseName.length + 400));
      
      const outcomeKeywords = [
        'held that', 'ruled that', 'decided that', 'found that', 'concluded that',
        'awarded', 'damages', 'granted', 'denied', 'affirmed', 'reversed',
        'judgment', 'verdict', 'decision', 'outcome', 'result'
      ];
      
      for (const keyword of outcomeKeywords) {
        const keywordIndex = contextArea.toLowerCase().indexOf(keyword);
        if (keywordIndex !== -1) {
          // Extract sentence containing the keyword
          const sentenceStart = contextArea.lastIndexOf('.', keywordIndex) + 1;
          const sentenceEnd = contextArea.indexOf('.', keywordIndex + keyword.length);
          if (sentenceEnd !== -1) {
            return contextArea.substring(sentenceStart, sentenceEnd + 1).trim();
          }
        }
      }
    }
    return "Case outcome and holding available in detailed analysis";
  };

  const extractCasesFromText = (content: string, citations: string[]): PerplexityCase[] => {
    const cases: PerplexityCase[] = [];
    
    // Enhanced case name patterns
    const casePatterns = [
      /([A-Z][a-zA-Z\s&.,-]+\s+v\.\s+[A-Z][a-zA-Z\s&.,-]+)/g,
      /([A-Z][a-zA-Z\s&.,-]+\s+vs\.\s+[A-Z][a-zA-Z\s&.,-]+)/g,
      /In\s+re\s+[A-Z][a-zA-Z\s&.,-]+/g,
      /([A-Z][a-zA-Z\s&.,-]+\s+v\s+[A-Z][a-zA-Z\s&.,-]+)/g
    ];

    const foundCases = new Set<string>();

    casePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 10 && cleanMatch.length < 100 && !foundCases.has(cleanMatch)) {
            foundCases.add(cleanMatch);
            
            if (cases.length < 5) {
              cases.push({
                caseName: cleanMatch,
                court: extractCourtFromContent(content, cleanMatch),
                citation: extractCitationFromContent(content, cleanMatch),
                date: extractDateFromContent(content, cleanMatch),
                relevantFacts: extractRelevantFacts(content, cleanMatch),
                outcome: extractOutcome(content, cleanMatch),
                url: findCitationUrl(citations, cleanMatch)
              });
            }
          }
        });
      }
    });

    return cases;
  };

  const extractCourtFromContent = (content: string, caseName: string): string => {
    const caseIndex = content.indexOf(caseName);
    if (caseIndex !== -1) {
      const contextArea = content.substring(Math.max(0, caseIndex - 100), caseIndex + caseName.length + 200);
      
      const courtPatterns = [
        /Texas\s+Supreme\s+Court/gi,
        /Supreme\s+Court\s+of\s+Texas/gi,
        /Texas\s+Court\s+of\s+Appeals/gi,
        /Court\s+of\s+Appeals\s+of\s+Texas/gi,
        /\d+\w*\s+District\s+Court/gi,
        /U\.S\.\s+District\s+Court/gi,
        /Fifth\s+Circuit/gi,
        /\d+\w*\s+Judicial\s+District/gi
      ];
      
      for (const pattern of courtPatterns) {
        const matches = contextArea.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0];
        }
      }
    }
    return "Texas Court";
  };

  const findCitationUrl = (citations: string[], caseName: string): string | undefined => {
    // Try to find URL in citations that might relate to this case
    for (const citation of citations) {
      if (citation.includes('http') && (
        citation.toLowerCase().includes(caseName.toLowerCase().split(' ')[0]) ||
        citation.includes('justia.com') ||
        citation.includes('courtlistener.com')
      )) {
        return citation;
      }
    }
    return undefined;
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