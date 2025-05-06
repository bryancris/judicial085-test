
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const courtListenerApiKey = Deno.env.get('COURTLISTENER_API_KEY') || '76ddb006469713cde169d7d8a2907ca5ff600b3a';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    console.log(`Searching for similar cases to client ID: ${clientId}`);

    // Get the client's name for reference
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
      throw new Error('Could not find client data');
    }

    // Fetch the current client's legal analysis
    const { data: currentAnalysis, error: analysisError } = await supabase
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (analysisError || !currentAnalysis) {
      console.error('Error fetching current analysis:', analysisError);
      throw new Error('No legal analysis found for this client');
    }

    // Extract key terms and relevant laws from the analysis
    const relevantLaw = extractSection(currentAnalysis.content, 'RELEVANT TEXAS LAW');
    const legalIssues = extractSection(currentAnalysis.content, 'POTENTIAL LEGAL ISSUES');
    const preliminaryAnalysis = extractSection(currentAnalysis.content, 'PRELIMINARY ANALYSIS');
    
    // Generate search terms based on analysis content
    const searchTerms = generateSearchTerms(relevantLaw, legalIssues, preliminaryAnalysis);
    console.log("Generated search terms:", searchTerms);
    
    // First try to find similar cases from our own database
    const { data: otherAnalyses, error: otherAnalysesError } = await supabase
      .from('legal_analyses')
      .select('content, client_id, created_at')
      .neq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (otherAnalysesError) {
      console.error('Error fetching other analyses:', otherAnalysesError);
      throw new Error('Failed to search for similar cases in database');
    }

    // Group analyses by client and take the most recent one for each
    const latestAnalysesByClient = otherAnalyses.reduce((acc, analysis) => {
      if (!acc[analysis.client_id] || new Date(analysis.created_at) > new Date(acc[analysis.client_id].created_at)) {
        acc[analysis.client_id] = analysis;
      }
      return acc;
    }, {});

    // Extract key information from the current analysis
    const currentRelevantLaw = extractSection(currentAnalysis.content, 'RELEVANT TEXAS LAW');
    const currentPreliminaryAnalysis = extractSection(currentAnalysis.content, 'PRELIMINARY ANALYSIS');
    const currentIssues = extractSection(currentAnalysis.content, 'POTENTIAL LEGAL ISSUES');

    // Combine the sections to create a search document
    const currentSearchDocument = [
      currentRelevantLaw,
      currentPreliminaryAnalysis, 
      currentIssues
    ].join(' ');

    // For each client, calculate similarity score
    const internalSimilarityResults = await Promise.all(
      Object.values(latestAnalysesByClient).map(async (analysis: any) => {
        const relevantLaw = extractSection(analysis.content, 'RELEVANT TEXAS LAW');
        const preliminaryAnalysis = extractSection(analysis.content, 'PRELIMINARY ANALYSIS');
        const issues = extractSection(analysis.content, 'POTENTIAL LEGAL ISSUES');

        const searchDocument = [relevantLaw, preliminaryAnalysis, issues].join(' ');
        
        // Calculate similarity score (simple text-based similarity for now)
        const similarityScore = calculateSimilarity(currentSearchDocument, searchDocument);

        // Get the client details
        const { data: otherClient } = await supabase
          .from('clients')
          .select('first_name, last_name')
          .eq('id', analysis.client_id)
          .single();

        // Get potential outcome prediction from the analysis
        const outcomeText = extractOutcomePrediction(analysis.content);
        
        return {
          source: "internal",
          clientId: analysis.client_id,
          clientName: otherClient ? `${otherClient.first_name} ${otherClient.last_name}` : 'Unknown Client',
          similarity: similarityScore,
          relevantFacts: extractRelevantFacts(analysis.content),
          outcome: outcomeText,
          court: "N/A",
          citation: "Client Case",
          dateDecided: new Date(analysis.created_at).toLocaleDateString(),
          url: null
        };
      })
    );

    // Now query the CourtListener API with improved search terms
    let courtListenerResults = [];
    
    try {
      console.log("Querying CourtListener API with search terms:", searchTerms);
      
      // Add common slip and fall related terms to improve search results
      const enhancedSearchTerms = addCommonLegalTerms(searchTerms, currentSearchDocument);
      console.log("Enhanced search terms:", enhancedSearchTerms);
      
      // Build query for CourtListener API with correct query parameters
      const queryParams = new URLSearchParams({
        q: enhancedSearchTerms,
        // Per the documentation, we can search across all jurisdictions to get more results
        // We'll sort and filter them on our side
        order_by: 'score desc',
        type: 'o',  // Only get opinions
        format: 'json'
      });
      
      const url = `https://www.courtlistener.com/api/rest/v3/search/?${queryParams.toString()}`;
      
      console.log("Court Listener request URL:", url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${courtListenerApiKey}`
        }
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`CourtListener API error: ${response.status}, Response: ${responseText}`);
        throw new Error(`CourtListener API returned ${response.status}: ${responseText}`);
      }

      const data = await response.json();
      console.log(`Found ${data.results.length} cases from CourtListener API`);

      // Process CourtListener results
      courtListenerResults = await Promise.all(data.results.slice(0, 15).map(async (result) => {
        console.log("Processing result:", result.caseName);
        
        // Get the full opinion text if available
        let opinionText = "";
        if (result.id && result.absolute_url) {
          try {
            const opinionUrl = `https://www.courtlistener.com/api/rest/v3/opinions/${result.id}/`;
            const opinionResponse = await fetch(opinionUrl, {
              headers: {
                'Authorization': `Token ${courtListenerApiKey}`
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
          clientName: result.caseName || "Unknown Case",
          similarity: 0.75, // Higher default similarity to ensure results show up
          relevantFacts: snippet,
          outcome: extractOutcomeFromOpinion(opinionText || ""),
          court: result.court_name || result.court || "Court of Record",
          citation: result.citation || result.citeCount || "No citation available",
          dateDecided: result.dateFiled ? new Date(result.dateFiled).toLocaleDateString() : "Unknown date",
          url: result.absolute_url ? `https://www.courtlistener.com${result.absolute_url}` : null
        };
      }));
      
      console.log(`Successfully processed ${courtListenerResults.length} CourtListener results`);
    } catch (apiError) {
      console.error('Error querying CourtListener API:', apiError);
      // Continue with just internal results if API fails
    }

    // Combine and sort both internal and CourtListener results
    const combinedResults = [...internalSimilarityResults, ...courtListenerResults]
      .filter(result => result.similarity > 0.2 || result.source === "courtlistener") // Include all CourtListener results
      .sort((a, b) => {
        // Prioritize CourtListener results slightly
        if (a.source === "courtlistener" && b.source !== "courtlistener") return -1;
        if (a.source !== "courtlistener" && b.source === "courtlistener") return 1;
        // Then sort by similarity
        return b.similarity - a.similarity;
      })
      .slice(0, 10); // Top 10 most similar

    console.log(`Found ${combinedResults.length} total similar cases`);

    return new Response(
      JSON.stringify({ 
        similarCases: combinedResults,
        currentClient: `${clientData.first_name} ${clientData.last_name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-similar-cases function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to search for similar cases' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract a section from the analysis content
function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// Simple text similarity function based on word overlap
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Extract relevant facts from the analysis content
function extractRelevantFacts(content: string): string {
  const preliminaryAnalysis = extractSection(content, 'PRELIMINARY ANALYSIS');
  // Take the first 200 characters as a summary
  return preliminaryAnalysis.length > 200 
    ? preliminaryAnalysis.substring(0, 200) + '...'
    : preliminaryAnalysis;
}

// Extract outcome prediction from the analysis content
function extractOutcomePrediction(content: string): string {
  // Look for sentences containing outcome predictions
  const sentences = content.split(/\.\s+/);
  
  const outcomeKeywords = [
    'likely outcome', 'probability', 'chances', 'likelihood', 
    'favorable', 'unfavorable', 'success', 'prevail', 'win', 'lose'
  ];
  
  const outcomeSentences = sentences.filter(sentence => 
    outcomeKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  if (outcomeSentences.length > 0) {
    return outcomeSentences[0].trim() + '.';
  }
  
  // Default outcome if no prediction found
  return "No specific outcome prediction available.";
}

// Generate search terms for CourtListener API based on legal analysis
function generateSearchTerms(relevantLaw: string, legalIssues: string, preliminaryAnalysis: string): string {
  // Extract potential statutes
  const statuteMatches = relevantLaw.match(/([A-Z][\w\s]+Code\s+§+\s*\d+[\w\.\-]*)/g) || [];
  
  // Extract key legal terms
  const legalTerms = new Set<string>();
  
  // Try to identify case type (slip and fall, car accident, etc)
  const caseType = identifyCaseType(preliminaryAnalysis);
  if (caseType) {
    legalTerms.add(caseType);
  }
  
  // Process relevant law for legal terms
  const lawWords = relevantLaw.split(/\W+/);
  for (let i = 0; i < lawWords.length - 1; i++) {
    if (lawWords[i].length > 3 && lawWords[i][0].toUpperCase() === lawWords[i][0]) {
      const term = lawWords[i] + ' ' + lawWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Process legal issues for additional terms
  const issueWords = legalIssues.split(/\W+/);
  for (let i = 0; i < issueWords.length - 1; i++) {
    if (issueWords[i].length > 4) {
      const term = issueWords[i] + ' ' + issueWords[i+1];
      if (term.length > 7) legalTerms.add(term);
    }
  }
  
  // Extract named entities that might be relevant (like "premises liability")
  extractNamedEntities(preliminaryAnalysis).forEach(entity => {
    legalTerms.add(entity);
  });
  
  // Combine statutes and best legal terms
  const statutes = statuteMatches.slice(0, 2).join(' ');
  const bestTerms = Array.from(legalTerms).slice(0, 5).join(' ');
  
  return `${statutes} ${bestTerms}`.trim();
}

// Add common legal terms based on case type to improve search results
function addCommonLegalTerms(searchTerms: string, caseText: string): string {
  // Check if this is likely a premises liability or slip and fall case
  if (caseText.toLowerCase().includes("slip") && caseText.toLowerCase().includes("fall") || 
      caseText.toLowerCase().includes("premises liability")) {
    return `${searchTerms} "slip and fall" "premises liability" negligence duty dangerous condition`;
  }
  
  // Check if this is likely a car accident case
  if (caseText.toLowerCase().includes("car accident") || 
      caseText.toLowerCase().includes("motor vehicle") || 
      caseText.toLowerCase().includes("automobile")) {
    return `${searchTerms} "motor vehicle" accident collision negligence`;
  }
  
  // For other types of cases, add some general legal terms
  return `${searchTerms} liability negligence damages plaintiff defendant`;
}

// Identify the type of case from the analysis
function identifyCaseType(analysis: string): string | null {
  const lowerAnalysis = analysis.toLowerCase();
  
  // Check for common case types
  if (lowerAnalysis.includes("slip") && lowerAnalysis.includes("fall")) {
    return "slip and fall";
  }
  if (lowerAnalysis.includes("premises liability")) {
    return "premises liability";
  }
  if (lowerAnalysis.includes("car accident") || lowerAnalysis.includes("motor vehicle") || lowerAnalysis.includes("auto accident")) {
    return "motor vehicle accident";
  }
  if (lowerAnalysis.includes("medical malpractice")) {
    return "medical malpractice";
  }
  if (lowerAnalysis.includes("product liability") || lowerAnalysis.includes("defective product")) {
    return "product liability";
  }
  
  return null;
}

// Simple function to extract potential named entities
function extractNamedEntities(text: string): string[] {
  const entities: string[] = [];
  const matches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
  
  // Filter out common irrelevant entities and duplicates
  return [...new Set(matches.filter(entity => 
    entity.length > 5 && 
    !entity.includes("Texas") && 
    !entity.includes("Attorney") &&
    !entity.includes("Court")
  ))];
}

// Extract a relevant snippet from a court opinion based on search terms
function extractRelevantSnippet(opinionText: string, searchTerms: string): string {
  // Split search terms into individual words
  const terms = searchTerms.toLowerCase().split(/\W+/).filter(term => term.length > 3);
  
  // Split opinion into paragraphs
  const paragraphs = opinionText.split(/\n\n+/);
  
  // Score each paragraph based on how many search terms it contains
  const scoredParagraphs = paragraphs.map(paragraph => {
    const paraLower = paragraph.toLowerCase();
    let score = 0;
    
    // Count occurrences of search terms
    terms.forEach(term => {
      if (paraLower.includes(term)) {
        score += 1;
      }
    });
    
    // Bonus for paragraphs mentioning slip and fall or premises liability
    if (paraLower.includes("slip") && paraLower.includes("fall")) {
      score += 3;
    }
    if (paraLower.includes("premises liability")) {
      score += 3;
    }
    
    return { paragraph, score };
  });
  
  // Sort paragraphs by score (highest first)
  scoredParagraphs.sort((a, b) => b.score - a.score);
  
  // If we found a relevant paragraph, return it (trimmed if too long)
  if (scoredParagraphs.length > 0 && scoredParagraphs[0].score > 0) {
    const bestParagraph = scoredParagraphs[0].paragraph;
    return bestParagraph.length > 300 
      ? bestParagraph.substring(0, 297) + '...'
      : bestParagraph;
  }
  
  // Fallback to first 200 characters if no relevant paragraph found
  return opinionText.length > 200 
    ? opinionText.substring(0, 197) + '...' 
    : opinionText;
}

// Extract the outcome from a court opinion
function extractOutcomeFromOpinion(opinionText: string): string {
  // Look for common phrases that indicate the outcome
  const conclusionKeywords = [
    'therefore', 'accordingly', 'thus', 'we affirm', 'we reverse', 
    'judgment is affirmed', 'judgment is reversed', 'we conclude'
  ];
  
  // Check for common slip and fall outcomes
  const slipFallOutcomes = [
    'summary judgment', 'premises liability', 'duty of care', 
    'business invitee', 'dangerous condition', 'condition was open and obvious'
  ];
  
  // Split into paragraphs to look for conclusion
  const paragraphs = opinionText.split(/\n\n+/);
  
  // First check for slip and fall specific outcome language
  for (const paragraph of paragraphs) {
    const paraLower = paragraph.toLowerCase();
    
    for (const keyword of slipFallOutcomes) {
      if (paraLower.includes(keyword)) {
        // Get the sentence containing the keyword
        const sentences = paragraph.split(/\.\s+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            return sentence.trim() + '.';
          }
        }
      }
    }
  }
  
  // Check the last few paragraphs for conclusion statements
  for (let i = Math.max(0, paragraphs.length - 3); i < paragraphs.length; i++) {
    const para = paragraphs[i].toLowerCase();
    
    for (const keyword of conclusionKeywords) {
      if (para.includes(keyword)) {
        // Get the sentence containing the keyword
        const sentences = paragraphs[i].split(/\.\s+/);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(keyword)) {
            return sentence.trim() + '.';
          }
        }
        // Return the whole paragraph if specific sentence not found
        return paragraphs[i].length > 300 
          ? paragraphs[i].substring(0, 297) + '...' 
          : paragraphs[i];
      }
    }
  }
  
  // Fallback if no clear conclusion found
  return "Case outcome details not available";
}
