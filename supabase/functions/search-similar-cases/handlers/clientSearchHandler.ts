
import { corsHeaders } from "../utils/corsUtils.ts";
import { supabase } from "../index.ts";
import { processCourtListenerResults } from "./courtListenerHandler.ts";
import { processInternalAnalyses } from "./internalAnalysisHandler.ts";
import { generateFallbackCases, getFallbackCasesByType } from "../utils/fallbackCases.ts";
import { extractSection } from "../utils/textUtils.ts";
import { identifyCaseType, detectCaseTypeFromText } from "../utils/caseTypeDetector.ts";
import { generateSearchTerms } from "../utils/searchTermGenerator.ts";

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
    .select('content, case_type')
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
    
    // Return some generic fallback cases since we have no legal analysis to compare with
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
    .select('content, client_id, created_at, case_type')
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

  // Detect the case type directly from the analysis text
  const detectedCaseType = detectCaseTypeFromText(currentSearchDocument);
  console.log("Detected case type from content:", detectedCaseType);
  
  // Use case_type from database or detected type, with preference for HOA type
  let caseType = currentAnalysis.case_type || await identifyCaseType(clientId);
  if (detectedCaseType === "hoa" || 
      (currentAnalysis.content && currentAnalysis.content.toLowerCase().includes("hoa"))) {
    caseType = "hoa";
  }
  console.log("Final case type for search:", caseType);

  // Generate search terms based on analysis content and case type
  const searchTerms = generateSearchTerms(currentRelevantLaw, currentIssues, currentPreliminaryAnalysis, caseType);
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
    courtListenerApiKey,
    caseType
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
