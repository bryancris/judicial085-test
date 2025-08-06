
import { corsHeaders } from "../utils/corsUtils.ts";
import { analyzeCase, generateAdaptiveSearchTerms } from "../services/adaptiveCaseAnalyzer.ts";
import { handleCourtListenerSearch } from "./courtListenerHandler.ts";

export async function handleAdaptiveClientSearch(
  clientId: string,
  courtListenerApiKey: string
): Promise<Response> {
  try {
    console.log(`=== ADAPTIVE CLIENT SEARCH START for ${clientId} ===`);
    
    // Perform AI-powered case analysis
    const analysisResult = await analyzeCase(clientId);
    console.log(`Analysis complete. Primary legal area: ${analysisResult.primaryLegalArea}, Confidence: ${analysisResult.confidence}`);
    
    // Generate adaptive search terms based on analysis
    const searchTerms = generateAdaptiveSearchTerms(analysisResult);
    console.log(`Generated search terms: ${searchTerms}`);
    
    // Search for similar cases using the adaptive terms
    let courtListenerResults = await handleCourtListenerSearch(searchTerms, courtListenerApiKey);
    
    // Parse the response to check for results
    let courtListenerData = await courtListenerResults.json();
    
    if (courtListenerData.similarCases && courtListenerData.similarCases.length > 0) {
      console.log(`Found ${courtListenerData.similarCases.length} similar cases via adaptive search`);
      
      return new Response(
        JSON.stringify({
          similarCases: courtListenerData.similarCases,
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "adaptive-ai-analysis",
          legalArea: analysisResult.primaryLegalArea,
          confidence: analysisResult.confidence
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no results found, try with broader search terms
    console.log("No results with specific terms, trying broader search...");
    const broaderTerms = generateBroaderSearchTerms(analysisResult);
    console.log(`Broader search terms: ${broaderTerms}`);
    
    const broaderResults = await handleCourtListenerSearch(broaderTerms, courtListenerApiKey);
    const broaderData = await broaderResults.json();
    
    if (broaderData.similarCases && broaderData.similarCases.length > 0) {
      console.log(`Found ${broaderData.similarCases.length} cases with broader search`);
      
      return new Response(
        JSON.stringify({
          similarCases: broaderData.similarCases,
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "adaptive-broad-search",
          legalArea: analysisResult.primaryLegalArea,
          confidence: analysisResult.confidence * 0.8
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If still no results, try very basic premises liability search for general cases
    if (analysisResult.primaryLegalArea === "general" || analysisResult.primaryLegalArea === "premises-liability") {
      console.log("Trying basic premises liability search as final attempt...");
      const basicTerms = '"premises liability" OR "slip and fall" OR "negligence" Texas';
      const basicResults = await handleCourtListenerSearch(basicTerms, courtListenerApiKey);
      const basicData = await basicResults.json();
      
      if (basicData.similarCases && basicData.similarCases.length > 0) {
        console.log(`Found ${basicData.similarCases.length} cases with basic premises liability search`);
        
        return new Response(
          JSON.stringify({
            similarCases: basicData.similarCases,
            fallbackUsed: false,
            analysisFound: true,
            searchStrategy: "basic-premises-search",
            legalArea: "premises-liability",
            confidence: 0.6
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // No external results found - return no results with legal disclaimer
    console.log(`No similar cases found for ${analysisResult.primaryLegalArea}`);
    
    return new Response(
      JSON.stringify({
        similarCases: [],
        fallbackUsed: false,
        analysisFound: true,
        searchStrategy: "no-results-found",
        legalArea: analysisResult.primaryLegalArea,
        confidence: analysisResult.confidence,
        message: "No similar cases found in legal databases. Please consult additional legal research sources and verify all legal precedents independently.",
        disclaimer: "All legal research results require independent verification. This AI-assisted search does not guarantee completeness of available case law."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in adaptive client search:", error);
    
    // Return error response with legal disclaimer
    return new Response(
      JSON.stringify({
        similarCases: [],
        fallbackUsed: false,
        analysisFound: false,
        searchStrategy: "search-error",
        error: error.message,
        message: "Search encountered an error. Please try alternative legal research methods.",
        disclaimer: "All legal research results require independent verification. This AI-assisted search does not guarantee completeness of available case law."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function generateBroaderSearchTerms(analysisResult: any): string {
  const broaderTerms: string[] = [];
  
  // Use primary legal area with broader interpretation
  if (analysisResult.primaryLegalArea && analysisResult.primaryLegalArea !== "general") {
    if (analysisResult.primaryLegalArea === "premises-liability") {
      broaderTerms.push('"premises liability"', '"slip and fall"', '"negligence"');
    } else {
      const areaTerms = analysisResult.primaryLegalArea.replace(/-/g, ' ');
      broaderTerms.push(`"${areaTerms}"`);
    }
  }
  
  // Add most important legal concepts (broader terms)
  if (analysisResult.legalConcepts && analysisResult.legalConcepts.length > 0) {
    // Take first 2 concepts for broader search
    broaderTerms.push(`"${analysisResult.legalConcepts[0]}"`);
    if (analysisResult.legalConcepts.length > 1) {
      broaderTerms.push(`"${analysisResult.legalConcepts[1]}"`);
    }
  }
  
  // Add Texas and general legal terms
  broaderTerms.push("Texas", "liability");
  
  // If this appears to be a general case, add premises liability terms
  if (analysisResult.primaryLegalArea === "general") {
    broaderTerms.push('"premises liability"');
  }
  
  const finalTerms = broaderTerms.join(' OR ');
  console.log(`Generated broader terms: ${finalTerms}`);
  return finalTerms;
}

// REMOVED: No longer using synthetic fallback cases to ensure legal compliance
// All case data must come from verified external sources only
