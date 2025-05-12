
import { corsHeaders } from "../utils/corsUtils.ts";
import { supabase } from "../index.ts";
import { processCourtListenerResults } from "./courtListenerHandler.ts";
import { processInternalAnalyses } from "./internalAnalysisHandler.ts";
import { generateFallbackCases } from "../utils/fallbackCases.ts";

export async function handleClientSearch(clientId: string, courtListenerApiKey: string) {
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
    .maybeSingle();

  if (analysisError) {
    console.error('Error fetching current analysis:', analysisError);
    throw new Error('Error retrieving legal analysis');
  }

  if (!currentAnalysis) {
    console.error('No legal analysis found for client:', clientId);
    
    // Return some fallback cases since we have no legal analysis to compare with
    return new Response(
      JSON.stringify({
        similarCases: generateFallbackCases(clientData.first_name, clientData.last_name),
        currentClient: `${clientData.first_name} ${clientData.last_name}`,
        analysisFound: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

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

  // Extract key information from the current analysis for search comparison
  const currentRelevantLaw = extractSection(currentAnalysis.content, 'RELEVANT TEXAS LAW');
  const currentPreliminaryAnalysis = extractSection(currentAnalysis.content, 'PRELIMINARY ANALYSIS');
  const currentIssues = extractSection(currentAnalysis.content, 'POTENTIAL LEGAL ISSUES');

  // Combine the sections to create a search document
  const currentSearchDocument = [
    currentRelevantLaw,
    currentPreliminaryAnalysis, 
    currentIssues
  ].join(' ');

  // Log the content to help with debugging
  console.log("Current client analysis content:", {
    law: currentRelevantLaw.substring(0, 100) + "...",
    analysis: currentPreliminaryAnalysis.substring(0, 100) + "...",
    issues: currentIssues.substring(0, 100) + "..."
  });

  // Check if we can detect the case type
  const caseType = identifyCaseType(currentPreliminaryAnalysis);
  console.log("Detected case type:", caseType);

  // Generate search terms based on analysis content
  const searchTerms = generateSearchTerms(currentRelevantLaw, currentIssues, currentPreliminaryAnalysis);
  console.log("Generated search terms:", searchTerms);

  // Process internal analyses  
  const internalSimilarityResults = await processInternalAnalyses(
    otherAnalyses, 
    currentSearchDocument
  );
  
  // Process CourtListener results
  const courtListenerResults = await processCourtListenerResults(
    searchTerms, 
    currentSearchDocument, 
    courtListenerApiKey
  );

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
      currentClient: `${clientData.first_name} ${clientData.last_name}`,
      analysisFound: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper function to extract a section from the analysis content
export function extractSection(content: string, sectionName: string): string {
  if (!content) return '';
  
  const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// Identify the type of case from the analysis
export function identifyCaseType(analysis: string): string | null {
  if (!analysis) return null;
  
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

// Generate search terms for CourtListener API based on legal analysis
export function generateSearchTerms(relevantLaw: string, legalIssues: string, preliminaryAnalysis: string): string {
  // Default search terms if sections are empty
  if (!relevantLaw && !legalIssues && !preliminaryAnalysis) {
    return "slip and fall premises liability negligence";
  }
  
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
  
  // Always add key terms for slip and fall cases
  legalTerms.add("slip and fall");
  legalTerms.add("premises liability");
  legalTerms.add("negligence");
  
  // Combine statutes and best legal terms
  const statutes = statuteMatches.slice(0, 2).join(' ');
  const bestTerms = Array.from(legalTerms).slice(0, 5).join(' ');
  
  const combinedTerms = `${statutes} ${bestTerms}`.trim();
  return combinedTerms.length > 0 ? combinedTerms : "slip and fall premises liability negligence";
}

// Simple function to extract potential named entities
export function extractNamedEntities(text: string): string[] {
  if (!text) return [];
  
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

// Add explicit legal terms to improve search results
export function addExplicitLegalTerms(searchTerms: string, caseText: string): string {
  const isSlipAndFall = caseText.toLowerCase().includes("slip") && 
                      caseText.toLowerCase().includes("fall") || 
                      caseText.toLowerCase().includes("premises liability");
  
  // Always add slip and fall terms regardless of case text
  let enhancedTerms = `${searchTerms} "slip and fall" "premises liability" negligence duty dangerous condition owner occupier`;
  
  // Add more variation to the search terms
  if (isSlipAndFall) {
    return `${enhancedTerms} hazard unsafe floor wet slippery`;
  }
  
  // Check if this is likely a car accident case
  if (caseText.toLowerCase().includes("car accident") || 
      caseText.toLowerCase().includes("motor vehicle") || 
      caseText.toLowerCase().includes("automobile")) {
    return `${enhancedTerms} "motor vehicle" accident collision negligence`;
  }
  
  return enhancedTerms;
}
