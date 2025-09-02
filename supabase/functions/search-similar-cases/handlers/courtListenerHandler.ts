import { corsHeaders } from "../utils/corsUtils.ts";
import { addExplicitLegalTerms } from "../utils/searchTermGenerator.ts";
import { detectCaseTypeFromContent } from "../utils/caseTypeDetector.ts";

// Texas courts for filtering to ensure only Texas precedents are returned
const TEXAS_COURTS = [
  "tex", "texcrimapp", "texapp1st", "texapp2nd", "texapp3rd", "texapp4th",
  "texapp5th", "texapp6th", "texapp7th", "texapp8th", "texapp9th", "texapp10th",
  "texapp11th", "texapp12th", "texapp13th", "texapp14th"
];

// Process Court Listener API results
export async function processCourtListenerResults(
  searchTerms: string, 
  currentSearchDocument: string, 
  courtListenerApiKey: string,
  caseType: string
): Promise<any[]> {
  let courtListenerResults = [];
  
  try {
    // Detect case type from content if not provided
    const detectedType = caseType || detectCaseTypeFromContent(currentSearchDocument);
    console.log(`=== COURTLISTENER SEARCH START ===`);
    console.log(`Using case type for search: ${detectedType}`);
    console.log(`Original search terms: ${searchTerms}`);
    
    // Add case-type specific terms to improve search results
    const enhancedSearchTerms = addExplicitLegalTerms(searchTerms, currentSearchDocument, detectedType);
    console.log(`Enhanced search terms: ${enhancedSearchTerms}`);
    
    // Build query for CourtListener API - use quoted phrases for better relevance
    // Filter to only Texas courts to ensure jurisdictional relevance
    const queryParams = new URLSearchParams({
      q: enhancedSearchTerms,
      order_by: 'score desc',
      type: 'o', // 'o' for opinions
      format: 'json'
    });
    
    // Add Texas court filters to ensure only Texas precedents
    TEXAS_COURTS.forEach(courtId => {
      queryParams.append('court', courtId);
    });
    
    const url = `https://www.courtlistener.com/api/rest/v4/search/?${queryParams.toString()}`;
    console.log(`CourtListener request URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${courtListenerApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseStatus = response.status;
    console.log(`CourtListener API response status: ${responseStatus}`);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`CourtListener API error: ${response.status}, Response: ${responseText}`);
      throw new Error(`CourtListener API returned ${response.status}: ${responseText}`);
    }

    const data = await response.json();
    console.log(`=== COURTLISTENER RESPONSE ANALYSIS ===`);
    console.log(`Total results found: ${data.results?.length || 0}`);
    
    if (data.results && data.results.length > 0) {
      // Log first few results for debugging
      console.log(`=== FIRST 3 RESULTS PREVIEW ===`);
      data.results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`Result ${index + 1}: ${result.caseName || result.case_name || 'Unknown'}`);
        console.log(`Court: ${result.court_name || result.court || 'Unknown'}`);
        console.log(`Snippet: ${(result.snippet || '').substring(0, 100)}...`);
      });
      
      // Process CourtListener results
      courtListenerResults = await Promise.all(data.results.slice(0, 10).map(async (result: any) => {
        const caseName = result.caseName || result.case_name || "Unknown Case";
        console.log(`Processing case: ${caseName}`);
        
        // Get the full opinion text if available
        let opinionText = "";
        const opinionId = result.id || result.resource_uri?.split('/').filter(Boolean).pop();
        const absoluteUrl = result.absolute_url || result.absolute_uri;
        
        if (opinionId) {
          try {
            const opinionUrl = `https://www.courtlistener.com/api/rest/v4/opinions/${opinionId}/`;
            const opinionResponse = await fetch(opinionUrl, {
              headers: {
                'Authorization': `Token ${courtListenerApiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (opinionResponse.ok) {
              const opinionData = await opinionResponse.json();
              opinionText = opinionData.plain_text || "";
            }
          } catch (opinionError) {
            console.error("Error fetching opinion text:", opinionError);
          }
        }
        
        // Extract the most relevant snippet from the opinion text
        const snippet = extractRelevantSnippet(
          opinionText || result.snippet || "", 
          enhancedSearchTerms
        );
        
        return {
          source: "courtlistener",
          clientId: null,
          clientName: caseName,
          similarity: 0.75,
          relevantFacts: snippet,
          outcome: extractOutcomeFromOpinion(opinionText || ""),
          court: result.court_name || result.court || "Court of Record",
          citation: result.citation || result.citation_count || result.citeCount || "No citation available",
          dateDecided: result.dateFiled || result.date_filed ? 
            new Date(result.dateFiled || result.date_filed).toLocaleDateString() : "Unknown date",
          url: absoluteUrl ? 
            (absoluteUrl.startsWith('http') ? absoluteUrl : `https://www.courtlistener.com${absoluteUrl}`) : null
        };
      }));
    } else {
      console.log(`❌ No results found from CourtListener API for terms: ${enhancedSearchTerms}`);
      // Legal compliance: No synthetic fallback cases - return empty results
      courtListenerResults = [];
    }
    
    console.log(`=== COURTLISTENER PROCESSING COMPLETE ===`);
    console.log(`Successfully processed ${courtListenerResults.length} cases`);
  } catch (apiError) {
    console.error('=== COURTLISTENER API ERROR ===', apiError);
    // Legal compliance: No synthetic fallback cases on API errors
    courtListenerResults = [];
  }
  
  return courtListenerResults;
}

// REMOVED: Synthetic animal protection cases for legal compliance

// Extract a relevant snippet from a court opinion based on search terms
export function extractRelevantSnippet(opinionText: string, searchTerms: string): string {
  if (!opinionText) return "No opinion text available";
  
  // For animal protection cases, look for specific indicators
  if (searchTerms.includes("animal") || searchTerms.includes("42.092") || searchTerms.includes("pet")) {
    const animalIndicators = [
      "animal cruelty", "pet boarding", "animal care", "42.092", "42.091", 
      "veterinary", "animal welfare", "pet death", "animal neglect"
    ];
    
    const paragraphs = opinionText.split(/\n\n+/);
    
    // Look for paragraphs containing animal-related terms
    for (const paragraph of paragraphs) {
      const paraLower = paragraph.toLowerCase();
      for (const indicator of animalIndicators) {
        if (paraLower.includes(indicator)) {
          return paragraph.length > 300 ? paragraph.substring(0, 297) + '...' : paragraph;
        }
      }
    }
  }
  
  // Generic snippet extraction for other cases
  const terms = searchTerms.toLowerCase().split(/\W+/).filter(term => term.length > 3);
  const paragraphs = opinionText.split(/\n\n+/);
  
  const scoredParagraphs = paragraphs.map(paragraph => {
    const paraLower = paragraph.toLowerCase();
    let score = 0;
    
    terms.forEach(term => {
      if (paraLower.includes(term)) {
        score += 1;
      }
    });
    
    return { paragraph, score };
  });
  
  scoredParagraphs.sort((a, b) => b.score - a.score);
  
  if (scoredParagraphs.length > 0 && scoredParagraphs[0].score > 0) {
    const bestParagraph = scoredParagraphs[0].paragraph;
    return bestParagraph.length > 300 ? bestParagraph.substring(0, 297) + '...' : bestParagraph;
  }
  
  return opinionText.length > 200 ? opinionText.substring(0, 197) + '...' : opinionText;
}

// Extract the outcome from a court opinion
export function extractOutcomeFromOpinion(opinionText: string): string {
  if (!opinionText) return "Case outcome details not available";
  
  // Look for animal protection specific outcomes
  if (opinionText.toLowerCase().includes("animal") || opinionText.toLowerCase().includes("pet")) {
    const animalOutcomes = [
      "animal cruelty", "pet death", "animal welfare", "cruelty conviction",
      "animal care", "pet boarding", "veterinary malpractice"
    ];
    
    const paragraphs = opinionText.split(/\n\n+/);
    
    for (const paragraph of paragraphs) {
      const paraLower = paragraph.toLowerCase();
      for (const outcome of animalOutcomes) {
        if (paraLower.includes(outcome)) {
          const sentences = paragraph.split(/\.\s+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(outcome)) {
              return sentence.trim() + '.';
            }
          }
        }
      }
    }
  }
  
  // Generic outcome extraction
  const conclusionKeywords = [
    'therefore', 'accordingly', 'thus', 'we affirm', 'we reverse', 
    'judgment is affirmed', 'judgment is reversed', 'we conclude'
  ];
  
  const paragraphs = opinionText.split(/\n\n+/);
  
  for (let i = Math.max(0, paragraphs.length - 3); i < paragraphs.length; i++) {
    const para = paragraphs[i].toLowerCase();
    
    for (const keyword of conclusionKeywords) {
      if (para.includes(keyword)) {
        const sentences = paragraphs[i].split(/\.\s+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            return sentence.trim() + '.';
          }
        }
        return paragraphs[i].length > 300 ? paragraphs[i].substring(0, 297) + '...' : paragraphs[i];
      }
    }
  }
  
  return "Case outcome details not available";
}

// REMOVED: Client-specific fallback cases for legal compliance
// All case data must come from verified external sources only
