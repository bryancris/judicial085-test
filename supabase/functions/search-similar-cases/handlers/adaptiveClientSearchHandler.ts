
import { corsHeaders } from "../utils/corsUtils.ts";
import { analyzeCase, generateAdaptiveSearchTerms } from "../services/adaptiveCaseAnalyzer.ts";
import { handleCourtListenerSearch } from "./courtListenerHandler.ts";
import { getFallbackCasesByType } from "../utils/fallbackCases.ts";

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
    const courtListenerResults = await handleCourtListenerSearch(searchTerms, courtListenerApiKey);
    
    // Parse the response to check for results
    const courtListenerData = await courtListenerResults.json();
    
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
    
    // If still no results, use intelligent fallback based on detected legal area
    console.log(`No external results found, using intelligent fallback for ${analysisResult.primaryLegalArea}`);
    const fallbackCases = getIntelligentFallbackCases(analysisResult.primaryLegalArea);
    
    return new Response(
      JSON.stringify({
        similarCases: fallbackCases,
        fallbackUsed: true,
        analysisFound: true,
        searchStrategy: "intelligent-fallback",
        legalArea: analysisResult.primaryLegalArea,
        confidence: analysisResult.confidence * 0.5
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in adaptive client search:", error);
    
    // Return generic fallback on error
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

function generateBroaderSearchTerms(analysisResult: any): string {
  const broaderTerms: string[] = [];
  
  // Use primary legal area
  if (analysisResult.primaryLegalArea && analysisResult.primaryLegalArea !== "general-legal-matter") {
    const areaTerms = analysisResult.primaryLegalArea.replace(/-/g, ' ');
    broaderTerms.push(`"${areaTerms}"`);
  }
  
  // Add most important legal concepts
  if (analysisResult.legalConcepts.length > 0) {
    broaderTerms.push(`"${analysisResult.legalConcepts[0]}"`);
  }
  
  // Add Texas and general legal terms
  broaderTerms.push("Texas", "law", "liability");
  
  return broaderTerms.join(' ');
}

function getIntelligentFallbackCases(legalArea: string): any[] {
  // Map AI-detected legal areas to appropriate fallback cases
  const legalAreaMap: Record<string, string> = {
    "property-law": "real-estate",
    "real-estate": "real-estate", 
    "hoa": "real-estate",
    "homeowners-association": "real-estate",
    "personal-injury": "personal-injury",
    "negligence": "personal-injury",
    "consumer-protection": "consumer-protection",
    "deceptive-trade": "consumer-protection",
    "contract-law": "contract",
    "employment-law": "employment",
    "family-law": "family",
    "criminal-law": "criminal",
    "animal-protection": "animal-protection"
  };
  
  const fallbackType = legalAreaMap[legalArea] || "general-liability";
  console.log(`Using intelligent fallback type: ${fallbackType} for legal area: ${legalArea}`);
  
  return getFallbackCasesByType(fallbackType);
}
