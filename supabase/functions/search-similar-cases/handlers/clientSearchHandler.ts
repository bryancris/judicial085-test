
import { corsHeaders } from "../utils/corsUtils.ts";
import { generateSearchTerms, addExplicitLegalTerms } from "../utils/searchTermGenerator.ts";
import { determineFinalCaseType } from "../utils/caseTypeDetector.ts";
import { handleCourtListenerSearch } from "./courtListenerHandler.ts";
import { getFallbackCasesByType } from "../utils/fallbackCases.ts";
import { supabase } from "../index.ts";

export async function handleClientSearch(
  clientId: string,
  courtListenerApiKey: string
): Promise<Response> {
  try {
    console.log(`=== CLIENT SEARCH START for ${clientId} ===`);
    
    // Get case information and legal analysis for this client
    const { analysisContent, storedCaseType } = await getClientAnalysisContent(clientId);
    
    if (!analysisContent) {
      console.log("No analysis content found, using fallback cases");
      return new Response(
        JSON.stringify({
          similarCases: getFallbackCasesByType("general"),
          fallbackUsed: true,
          analysisFound: false,
          searchStrategy: "no-analysis-fallback"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Using legal analysis as search document");
    
    // Determine the final case type using improved detection
    const finalCaseType = determineFinalCaseType(analysisContent, storedCaseType);
    console.log(`Final case type for search: ${finalCaseType}`);
    
    console.log(`Processing search for client ${clientId}, case type: ${finalCaseType}`);

    // Generate search terms based on the content and case type
    const baseSearchTerms = generateSearchTerms(analysisContent, finalCaseType);
    const enhancedSearchTerms = addExplicitLegalTerms(baseSearchTerms, analysisContent, finalCaseType);
    
    console.log(`Generated search terms: ${enhancedSearchTerms}`);

    // Search CourtListener with the enhanced terms
    const courtListenerResults = await handleCourtListenerSearch(enhancedSearchTerms, courtListenerApiKey);
    const courtListenerData = await courtListenerResults.json();

    console.log(`Found ${courtListenerData.similarCases?.length || 0} total similar cases`);

    if (courtListenerData.similarCases && courtListenerData.similarCases.length > 0) {
      return new Response(
        JSON.stringify({
          similarCases: courtListenerData.similarCases,
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "courtlistener-success",
          caseType: finalCaseType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Use fallback cases based on the detected case type
      console.log(`No external results found, using fallback for case type: ${finalCaseType}`);
      const fallbackCases = getFallbackCasesByType(finalCaseType);
      
      return new Response(
        JSON.stringify({
          similarCases: fallbackCases,
          fallbackUsed: true,
          analysisFound: true,
          searchStrategy: "type-specific-fallback",
          caseType: finalCaseType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error in client search:", error);
    return new Response(
      JSON.stringify({
        similarCases: getFallbackCasesByType("general"),
        fallbackUsed: true,
        analysisFound: false,
        searchStrategy: "error-fallback",
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getClientAnalysisContent(clientId: string): Promise<{
  analysisContent: string;
  storedCaseType: string | null;
}> {
  // Get the most recent legal analysis
  const { data: analyses } = await supabase
    .from('legal_analyses')
    .select('content')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  // Get case information
  const { data: cases } = await supabase
    .from('cases')
    .select('case_type, case_description, case_notes')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1);

  let analysisContent = '';
  let storedCaseType = null;

  if (analyses && analyses.length > 0) {
    analysisContent = analyses[0].content;
  }

  if (cases && cases.length > 0) {
    storedCaseType = cases[0].case_type;
    // Add case information to analysis content if available
    const caseInfo = [cases[0].case_description, cases[0].case_notes]
      .filter(Boolean)
      .join(' ');
    if (caseInfo) {
      analysisContent += '\n\n' + caseInfo;
    }
  }

  return { analysisContent, storedCaseType };
}
