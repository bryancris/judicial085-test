import { searchWithPerplexityReasoning } from "./perplexityApiService";
import { supabase } from "@/integrations/supabase/client";

export interface CitationDetails {
  id: string;
  caseName: string;
  court?: string;
  year?: string;
  citation: string;
  summary?: string;
  url?: string;
  fullText?: string;
  relevantExcerpts?: string[];
  source: "courtlistener" | "perplexity" | "knowledge_base";
  confidence: "high" | "medium" | "low";
  hasActualDocument?: boolean;
  alternativeSearchUrls?: Array<{
    name: string;
    url: string;
  }>;
}

export interface CitationResolutionResult {
  details?: CitationDetails;
  error?: string;
  searched: boolean;
}

/**
 * Parse case citation to extract case name, court, year, and citation number
 */
export const parseCitation = (citation: string): Partial<CitationDetails> => {
  // Extract case name (everything before the first comma or citation pattern)
  const caseNameMatch = citation.match(/^([^,]+(?:v\.[^,]+))/i);
  const caseName = caseNameMatch ? caseNameMatch[1].trim() : citation;

  // Extract year (4-digit number)
  const yearMatch = citation.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : undefined;

  // Extract court information (common court abbreviations)
  const courtMatch = citation.match(/\b(S\.Ct\.|F\.Supp\.|F\.3d|F\.2d|Tex\.|S\.W\.3d|S\.W\.2d)\b/i);
  const court = courtMatch ? courtMatch[0] : undefined;

  return {
    caseName,
    court,
    year,
    citation,
  };
};

/**
 * Search Court Listener API via Supabase edge function
 */
export const searchCourtListener = async (
  caseName: string, 
  citation: string
): Promise<CitationResolutionResult> => {
  try {
    console.log("Searching Court Listener for:", { caseName, citation });
    
    const { data, error } = await supabase.functions.invoke('search-court-listener', {
      body: {
        query: caseName,
        citation: citation
      }
    });

    if (error) {
      console.error("Court Listener search error:", error);
      return { searched: true, error: error.message };
    }

    if (data && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        searched: true,
        details: {
          id: `cl_${result.id}`,
          caseName: result.caseName || caseName,
          court: result.court,
          year: result.dateFiled ? new Date(result.dateFiled).getFullYear().toString() : undefined,
          citation,
          summary: result.snippet,
          url: result.absolute_url,
          source: "courtlistener",
          confidence: "high"
        }
      };
    }

    return { searched: true, error: "No results found in Court Listener" };
  } catch (err: any) {
    console.error("Exception in Court Listener search:", err);
    return { searched: true, error: err.message };
  }
};

/**
 * Search Perplexity for case details and analysis
 */
export const searchPerplexityForCase = async (
  caseName: string,
  citation: string
): Promise<CitationResolutionResult> => {
  try {
    console.log("Searching Perplexity for case:", { caseName, citation });
    
    const query = `Find details about the legal case "${caseName}" with citation "${citation}". Provide case summary, court, outcome, and key legal precedents.`;
    
    const { result, error } = await searchWithPerplexityReasoning(query);
    
    if (error) {
      console.error("Perplexity search error:", error);
      return { searched: true, error };
    }

    if (result && result.content) {
      return {
        searched: true,
        details: {
          id: `perp_${Date.now()}`,
          caseName,
          citation,
          summary: result.content,
          source: "perplexity",
          confidence: "medium",
          relevantExcerpts: result.citations
        }
      };
    }

    return { searched: true, error: "No results found in Perplexity" };
  } catch (err: any) {
    console.error("Exception in Perplexity search:", err);
    return { searched: true, error: err.message };
  }
};

/**
 * Search knowledge base for the citation
 */
export const searchKnowledgeBaseForCitation = async (
  citation: string
): Promise<CitationResolutionResult> => {
  try {
    console.log("Searching knowledge base for citation:", citation);
    
    const { data, error } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .ilike('content', `%${citation}%`)
      .limit(3);

    if (error) {
      console.error("Knowledge base search error:", error);
      return { searched: true, error: error.message };
    }

    if (data && data.length > 0) {
      const doc = data[0];
      const metadata = doc.metadata as any;
      const title = metadata?.title || metadata?.file_name || "Legal Document";
      const url = metadata?.url || metadata?.file_url;
      
      return {
        searched: true,
        details: {
          id: `kb_${doc.id}`,
          caseName: citation,
          citation,
          summary: doc.content ? doc.content.substring(0, 500) + "..." : "Document found in knowledge base",
          url: url,
          source: "knowledge_base",
          confidence: "high"
        }
      };
    }

    return { searched: true, error: "Citation not found in knowledge base" };
  } catch (err: any) {
    console.error("Exception in knowledge base search:", err);
    return { searched: true, error: err.message };
  }
};

/**
 * Generate alternative search URLs for manual case lookup
 */
const generateAlternativeSearchUrls = (caseName: string, citation: string) => {
  const encodedCaseName = encodeURIComponent(caseName);
  const encodedCitation = encodeURIComponent(citation);
  
  return [
    {
      name: "Google Scholar",
      url: `https://scholar.google.com/scholar?q="${encodedCaseName}"+OR+"${encodedCitation}"`
    },
    {
      name: "Justia",
      url: `https://law.justia.com/search?q=${encodedCaseName}`
    },
    {
      name: "FindLaw",
      url: `https://caselaw.findlaw.com/search.html?query=${encodedCaseName}`
    },
    {
      name: "Court Records",
      url: `https://www.google.com/search?q="${encodedCitation}"+site:courtlistener.com+OR+site:justia.com+OR+site:findlaw.com`
    }
  ];
};

/**
 * Comprehensive citation resolution using multiple sources
 */
export const resolveCitation = async (citation: string): Promise<CitationResolutionResult> => {
  console.log("Resolving citation:", citation);
  
  const parsedCitation = parseCitation(citation);
  const caseName = parsedCitation.caseName || citation;
  const alternativeUrls = generateAlternativeSearchUrls(caseName, citation);

  // Try Court Listener first (most authoritative for case law)
  const courtListenerResult = await searchCourtListener(caseName, citation);
  if (courtListenerResult.details) {
    // Mark as having actual document if URL is provided
    courtListenerResult.details.hasActualDocument = !!courtListenerResult.details.url;
    courtListenerResult.details.alternativeSearchUrls = alternativeUrls;
    return courtListenerResult;
  }

  // Try knowledge base (for statutes and local documents)
  const knowledgeBaseResult = await searchKnowledgeBaseForCitation(citation);
  if (knowledgeBaseResult.details) {
    knowledgeBaseResult.details.hasActualDocument = !!knowledgeBaseResult.details.url;
    knowledgeBaseResult.details.alternativeSearchUrls = alternativeUrls;
    return knowledgeBaseResult;
  }

  // Fall back to Perplexity ONLY as analysis, not as primary document
  const perplexityResult = await searchPerplexityForCase(caseName, citation);
  if (perplexityResult.details) {
    perplexityResult.details.hasActualDocument = false; // Mark as AI analysis
    perplexityResult.details.alternativeSearchUrls = alternativeUrls;
    // Lower confidence since this is AI analysis, not original document
    perplexityResult.details.confidence = "low";
    return perplexityResult;
  }

  // If nothing found, return error with alternative search options
  return {
    searched: true,
    error: "Citation could not be resolved from any source",
    details: {
      id: `fallback_${Date.now()}`,
      caseName,
      citation,
      summary: "Citation not found in available databases. Use the search links below to find this case manually.",
      source: "knowledge_base",
      confidence: "low",
      hasActualDocument: false,
      alternativeSearchUrls: alternativeUrls
    }
  };
};

/**
 * Cache citation resolutions to avoid repeated API calls
 */
const citationCache = new Map<string, CitationDetails>();

export const getCachedCitationDetails = (citation: string): CitationDetails | null => {
  return citationCache.get(citation) || null;
};

export const cacheCitationDetails = (citation: string, details: CitationDetails): void => {
  citationCache.set(citation, details);
};

export const resolveCitationWithCache = async (citation: string): Promise<CitationResolutionResult> => {
  // Check cache first
  const cached = getCachedCitationDetails(citation);
  if (cached) {
    return { searched: false, details: cached };
  }

  // Resolve and cache
  const result = await resolveCitation(citation);
  if (result.details) {
    cacheCitationDetails(citation, result.details);
  }

  return result;
};