import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, AlertCircle, Clock, Edit, Save, X, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

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
  const [debugInfo, setDebugInfo] = useState<{
    query?: string;
    searchType?: string;
    contextLength?: number;
    quickMode?: boolean;
  }>({});
  
  // Prompt editing state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const { toast } = useToast();

  // Load custom prompt from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`case-law-prompt-${clientId}`);
    if (saved) {
      setCustomPrompt(saved);
    }
  }, [clientId]);

  // Prompt management functions
  const handleEditPrompt = () => {
    setEditedPrompt(customPrompt || debugInfo.query || "");
    setIsEditingPrompt(true);
  };

  const handleSavePrompt = () => {
    setCustomPrompt(editedPrompt);
    if (clientId) {
      localStorage.setItem(`case-law-prompt-${clientId}`, editedPrompt);
    }
    setIsEditingPrompt(false);
    toast({
      title: "Prompt Saved",
      description: "Custom search prompt has been saved. Use 'Search Cases' to apply it.",
    });
  };

  const handleCancelEdit = () => {
    setEditedPrompt("");
    setIsEditingPrompt(false);
  };

  const handleResetPrompt = () => {
    setCustomPrompt("");
    if (clientId) {
      localStorage.removeItem(`case-law-prompt-${clientId}`);
    }
    setIsEditingPrompt(false);
    toast({
      title: "Prompt Reset",
      description: "Reset to default AI-generated prompt. Use 'Search Cases' to apply it.",
    });
  };

  // Get the effective query (custom or generated)
  const getEffectiveQuery = () => {
    return customPrompt || debugInfo.query || "";
  };

  // Generate fallback query for cases without stored metadata
  const generateFallbackQuery = () => {
    if (analysisData?.content || analysisData?.summary) {
      const context = analysisData?.content || analysisData?.summary || '';
      const keywords = ['Texas', caseType || 'legal', 'cases'].filter(Boolean);
      
      // Try to extract key legal terms from the analysis
      const legalTerms = [
        'lemon law', 'DTPA', 'warranty', 'breach', 'consumer protection',
        'negligence', 'contract', 'fraud', 'liability', 'damages'
      ];
      
      const lowerContext = context.toLowerCase();
      const foundTerms = legalTerms.filter(term => lowerContext.includes(term));
      
      if (foundTerms.length > 0) {
        return `Texas ${foundTerms.slice(0, 2).join(' ')} cases`;
      }
      
      return keywords.join(' ');
    }
    return `Texas ${caseType || 'legal'} cases`;
  };

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
          // Check if data is fresh (within 24 hours)
          const mostRecentCase = existingCases[0];
          const caseDate = new Date((mostRecentCase as any).created_at);
          const hoursAgo = (Date.now() - caseDate.getTime()) / (1000 * 60 * 60);
          const isFresh = hoursAgo < 24;
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

          // Restore search metadata from the first case if available
          const firstCase = existingCases[0] as any;
          if (firstCase?.validation_status) {
            try {
              const metadata = JSON.parse(firstCase.validation_status);
              if (metadata.searchQuery) {
                setDebugInfo({
                  query: metadata.searchQuery,
                  searchType: 'legal-research',
                  contextLength: metadata.contextLength || 0,
                  quickMode: metadata.quickMode || false
                });
              }
            } catch (e) {
              // If parsing fails, generate a fallback query
              const fallbackQuery = generateFallbackQuery();
              setDebugInfo({
                query: fallbackQuery,
                searchType: 'legal-research',
                contextLength: 0,
                quickMode: false
              });
            }
          } else {
            // Generate fallback query for older cases without stored metadata
            const fallbackQuery = generateFallbackQuery();
            setDebugInfo({
              query: fallbackQuery,
              searchType: 'legal-research',
              contextLength: 0,
              quickMode: false
            });
          }

          setCases(formattedCases);
          setHasSearched(true);
          setLastUpdated(caseDate.toLocaleDateString());
          
          console.log(`✅ Loaded ${formattedCases.length} existing additional case law entries (${isFresh ? 'fresh' : 'stale'})`);
        } else {
          // No existing cases found, auto-search ONLY if analysis data is available and specific to this analysis
          if ((analysisData?.content || analysisData?.summary) && 
              analysisData?.id && 
              !autoSearchAttempted) {
            console.log('No existing additional case law found for this specific analysis, auto-searching...');
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
  }, [clientId, analysisData?.id]); // Added analysisData?.id to dependencies

  // Auto-search when analysis data becomes available - REMOVED to prevent redundant searches
  // The main useEffect above handles loading and auto-searching properly

  // Function to save new cases to the database
  const saveNewCasesToDatabase = async (
    newCases: PerplexityCase[], 
    clientId: string,
    legalAnalysisId?: string,
    searchQuery?: string
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
      const casesToInsert = newCases.map((caseItem, index) => ({
        client_id: clientId,
        legal_analysis_id: legalAnalysisId || null,
        case_name: caseItem.caseName,
        court: caseItem.court,
        citation: caseItem.citation,
        date_decided: caseItem.date,
        relevant_facts: caseItem.relevantFacts,
        outcome: caseItem.outcome,
        url: caseItem.url,
        // Store search metadata in the first case entry
        ...(index === 0 && searchQuery ? { 
          validation_status: JSON.stringify({ searchQuery }) 
        } : {})
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

      // Build short case summary and Texas case law query
      const legalArea = caseAnalysis.primaryLegalArea || 'general-legal-matter';
      const concepts = caseAnalysis.legalConcepts || [];
      const keyFactors = caseAnalysis.keyFactors || [];
      const statutes = caseAnalysis.relevantStatutes || [];

      const parts: string[] = [];
      if (statutes.length) parts.push(`statutes: ${statutes.slice(0, 2).join(', ')}`);
      if (concepts.length) parts.push(concepts.slice(0, 2).join(', '));
      if (keyFactors.length) parts.push(keyFactors.slice(0, 2).join(', '));

      // Generate simple, natural language search terms
      const searchTerms = [
        "Texas",
        legalArea.replace(/-/g, ' '),
        ...concepts.slice(0, 2),
        "cases"
      ].filter(Boolean).join(' ');
      
      const query = searchTerms;
      const fullContext = (analysisData?.content || analysisData?.summary || '').toString();

      return {
        query,
        searchType: 'legal-research',
        context: fullContext.substring(0, 3000),
        analysisMetadata: caseAnalysis
      };

    } catch (error) {
      console.log('Using fallback query approach:', error);
      
      // Build context from analysis data
      const context = analysisData?.content || analysisData?.summary || '';
      
      // Extract legal keywords locally as fallback
      const legalKeywords = extractLocalKeywords(context);
      const keywordContext = legalKeywords.length > 0 ? legalKeywords.slice(0, 10).join(', ') : '';
      
      // Local keyword extraction function  
      function extractLocalKeywords(text: string): string[] {
        const keywords: string[] = [];
        const legalTerms = [
          'negligence', 'breach', 'warranty', 'contract', 'construction', 'easement', 'lien', 
          'foreclosure', 'probate', 'injunction', 'HOA', 'fraud', 'misrepresentation', 'UCC',
          'DTPA', 'property', 'deed', 'title', 'insurance', 'damages', 'liability', 'tort',
          'defamation', 'employment', 'discrimination', 'harassment', 'wrongful termination',
          'bankruptcy', 'divorce', 'custody', 'alimony', 'support', 'estate', 'will', 'trust',
          'lemon law', 'automobile', 'vehicle', 'car', 'truck', 'defect', 'repair', 'refund',
          'replacement', 'manufacturer', 'dealer', 'merchantability', 'fitness for purpose'
        ];
        
        const lowerText = text.toLowerCase();
        legalTerms.forEach(term => {
          if (lowerText.includes(term)) {
            keywords.push(term);
          }
        });
        
        return [...new Set(keywords)]; // Remove duplicates
      }
      
      // Simple fallback query
      const fallbackQuery = keywordContext 
        ? `Texas ${keywordContext} cases`.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
        : `Texas ${caseType || 'legal'} cases`;
        
      return {
        query: fallbackQuery,
        searchType: 'legal-research',
        context: context.substring(0, 3000),
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
      
      let query: string;
      let searchType: string;
      let context: string;
      let analysisMetadata: any;

      // Use custom prompt if available, otherwise use adaptive query
      if (customPrompt) {
        console.log('Using custom prompt for search');
        query = customPrompt;
        searchType = 'legal-research';
        context = (analysisData?.content || analysisData?.summary || '').toString().substring(0, 3000);
        analysisMetadata = null;
      } else {
        // Get adaptive query based on case analysis
        const adaptiveResult = await buildAdaptivePerplexityQuery(clientId);
        query = adaptiveResult.query;
        searchType = adaptiveResult.searchType;
        context = adaptiveResult.context;
        analysisMetadata = adaptiveResult.analysisMetadata;
      }
      
      // Store debug information for display
      setDebugInfo({
        query,
        searchType,
        contextLength: context?.length || 0,
        quickMode: false
      });
      
      console.log('Using query:', query.substring(0, 200) + '...');
      console.log('Search type:', searchType);

      // Try the search with regular model first
      let { data: resp, error: fxError } = await supabase.functions.invoke('perplexity-research', {
        body: {
          query,
          clientId,
          searchType,
          requestContext: 'additional-case-law',
          limit: 10,
          model: 'sonar-pro',
          context
        }
      });

      // Handle edge function success/error responses
      if (fxError) {
        throw new Error(`Edge Function returned a non-2xx status code: ${fxError.message}`);
      }

      // Check if edge function returned success: false
      if (!(resp as any)?.success) {
        console.log('First attempt failed, retrying with quick mode...');
        
        const retryResult = await supabase.functions.invoke('perplexity-research', {
          body: {
            query: query.length > 500 ? query.substring(0, 500) + '...' : query,
            clientId,
            searchType,
            requestContext: 'additional-case-law',
            limit: 5,
            model: 'sonar-pro',
            quickMode: true,
            context: context ? context.substring(0, 1500) : undefined
          }
        });

        if (!retryResult.error && (retryResult.data as any)?.success) {
          resp = retryResult.data;
          console.log('Quick mode retry succeeded');
          // Update debug info for quick mode
          setDebugInfo(prev => ({ ...prev, quickMode: true }));
        } else {
          // Show the original error details to user
          const errorDetails = (resp as any)?.details || (resp as any)?.error || 'Search failed';
          throw new Error(errorDetails);
        }
      }

      const content = (resp as any)?.content || '';
      const citations = (resp as any)?.citations || [];
      const structuredCases = (resp as any)?.structuredCases;

      console.log('Perplexity response received, extracting cases...');
      let newCases: PerplexityCase[] = [];
      
      // Prefer structured JSON cases if available
      if (structuredCases && Array.isArray(structuredCases) && structuredCases.length > 0) {
        console.log('Using structured JSON cases:', structuredCases.length);
        newCases = structuredCases.map((caseData: any) => ({
          caseName: caseData.caseName || caseData.case_name || 'Case name not available',
          court: caseData.court || 'Court information not available',
          citation: caseData.citation || 'Citation pending',
          date: caseData.date || caseData.date_decided || 'Date not available',
          relevantFacts: caseData.relevantFacts || caseData.relevant_facts || '',
          outcome: caseData.outcome || '',
          url: caseData.url || undefined
        }));
      } else {
        // Fallback to text extraction
        console.log('No structured cases, extracting from text...');
        newCases = extractCasesFromText(content, citations);
      }

      // Apply stronger topic filtering
      if (newCases.length > 0) {
        console.log('Applying relevance filtering...');
        newCases = filterCasesByRelevance(newCases, analysisData?.content || '', analysisMetadata);
      }

      // Resolve missing Justia URLs for cases that don't have them
      if (newCases.length > 0) {
        console.log('Resolving missing Justia URLs...');
        newCases = await resolveJustiaUrls(newCases);
      }

      if (clientId) {
        await saveNewCasesToDatabase(newCases, clientId, analysisData?.id, query);
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

  // Enhanced filtering for case relevance
  const filterCasesByRelevance = (cases: PerplexityCase[], analysisContent: string, analysisMetadata: any): PerplexityCase[] => {
    return cases.filter(caseItem => {
      const caseText = `${caseItem.caseName} ${caseItem.relevantFacts} ${caseItem.outcome}`.toLowerCase();
      
      // Exclude criminal cases (unless context suggests criminal law)
      const criminalKeywords = ['state of texas v', 'indictment', 'criminal', 'dwi', 'dui', 'theft', 'assault', 'murder', 'prosecution'];
      const isCriminal = criminalKeywords.some(keyword => caseText.includes(keyword));
      const contextSuggestsCriminal = analysisContent.toLowerCase().includes('criminal') || 
                                     analysisContent.toLowerCase().includes('prosecution');
      
      if (isCriminal && !contextSuggestsCriminal) {
        console.log(`Filtered out criminal case: ${caseItem.caseName}`);
        return false;
      }

      // Positive filters - prefer cases with these terms if they appear in analysis
      const analysisLower = analysisContent.toLowerCase();
      const positiveTerms = ['warranty', 'lemon law', 'construction', 'contract', 'breach', 'negligence', 'property', 'defect'];
      const hasPositiveMatch = positiveTerms.some(term => 
        analysisLower.includes(term) && caseText.includes(term)
      );

      // Negative filters - exclude obviously irrelevant topics
      const negativeTerms = ['divorce', 'custody', 'alimony', 'bankruptcy', 'probate', 'will', 'inheritance'];
      const hasNegativeMatch = negativeTerms.some(term => 
        !analysisLower.includes(term) && caseText.includes(term)
      );

      if (hasNegativeMatch) {
        console.log(`Filtered out off-topic case: ${caseItem.caseName}`);
        return false;
      }

      // If we have positive matches, prefer those
      if (hasPositiveMatch) {
        console.log(`Kept relevant case: ${caseItem.caseName}`);
        return true;
      }

      // For cases without clear positive/negative signals, apply concept matching if available
      if (analysisMetadata?.legalConcepts?.length > 0) {
        const hasConceptMatch = analysisMetadata.legalConcepts.some(concept => 
          caseText.includes(concept.toLowerCase())
        );
        return hasConceptMatch;
      }

      // Default: keep the case if no strong signals either way
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

  // Auto-resolve missing Justia URLs for cases
  const resolveJustiaUrls = async (cases: PerplexityCase[]): Promise<PerplexityCase[]> => {
    const casesToResolve = cases.filter(caseItem => 
      !caseItem.url || !caseItem.url.includes('law.justia.com')
    );
    
    if (casesToResolve.length === 0) {
      console.log('All cases already have Justia URLs');
      return cases;
    }

    console.log(`Resolving Justia URLs for ${casesToResolve.length} cases...`);
    
    // Process cases in parallel with concurrency limit
    const concurrency = 3;
    const resolvedCases = [...cases]; // Start with original cases
    
    for (let i = 0; i < casesToResolve.length; i += concurrency) {
      const batch = casesToResolve.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (caseItem) => {
        try {
          const { data: resolverResp, error } = await supabase.functions.invoke('resolve-justia-url', {
            body: {
              caseName: caseItem.caseName,
              citation: caseItem.citation
            }
          });

          if (!error && resolverResp?.url) {
            // Find the case in resolvedCases and update its URL
            const caseIndex = resolvedCases.findIndex(c => c.caseName === caseItem.caseName);
            if (caseIndex !== -1) {
              resolvedCases[caseIndex].url = resolverResp.url;
              console.log(`✅ Resolved Justia URL for: ${caseItem.caseName}`);
            }
          } else {
            console.log(`❌ Could not resolve Justia URL for: ${caseItem.caseName}`);
          }
        } catch (error) {
          console.error(`Error resolving URL for ${caseItem.caseName}:`, error);
        }
      });

      // Wait for this batch to complete
      await Promise.all(batchPromises);
      
      // Small delay between batches to avoid overwhelming the service
      if (i + concurrency < casesToResolve.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const resolvedCount = resolvedCases.filter(c => c.url?.includes('law.justia.com')).length;
    console.log(`URL resolution complete: ${resolvedCount}/${cases.length} cases have Justia URLs`);
    
    return resolvedCases;
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
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={searchAdditionalCases}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {hasSearched ? 'Refresh Cases (Fresh Search)' : 'Search Cases'}
          </Button>
          
          {cases.length > 0 && lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastUpdated}</span>
              <Badge variant="secondary" className="text-xs">
                Cached
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Prompt Section */}
        {getEffectiveQuery() && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Search Prompt</h4>
              <div className="flex items-center gap-2">
                {!isEditingPrompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditPrompt}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {customPrompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPrompt}
                    className="h-8 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
            
            {isEditingPrompt ? (
              <div className="space-y-3">
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-24 font-mono text-sm"
                  placeholder="Enter your custom search prompt..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSavePrompt}
                    disabled={!editedPrompt.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="font-mono text-sm bg-background p-3 rounded border whitespace-pre-wrap break-words">
                  {getEffectiveQuery()}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Type:</span> {debugInfo.searchType || 'legal-research'}
                  </div>
                  <div>
                    <span className="font-medium">Context:</span> {debugInfo.contextLength?.toLocaleString() || '0'} chars
                  </div>
                  <div>
                    <span className="font-medium">Quick Mode:</span> {debugInfo.quickMode ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Source:</span> {customPrompt ? 'Custom' : 'AI Generated'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
                        <span className="font-medium">Citation:</span> 
                        {caseItem.url && caseItem.url.includes('law.justia.com') ? (
                          <LawReferenceLink citation={caseItem.citation} url={caseItem.url} />
                        ) : (
                          <span className="text-muted-foreground">{caseItem.citation}</span>
                        )}
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