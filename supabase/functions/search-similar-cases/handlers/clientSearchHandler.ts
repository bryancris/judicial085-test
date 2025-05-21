
import { corsHeaders } from "../utils/corsUtils.ts";
import { supabase } from "../index.ts";
import { processCourtListenerResults } from "./courtListenerHandler.ts";
import { generateSearchTerms } from "../utils/searchTermGenerator.ts";
import { getFallbackCasesByType } from "../utils/fallbackCases.ts";
import { identifyCaseType, detectCaseTypeFromText } from "../utils/caseTypeDetector.ts";

// Process a client search request
export async function handleClientSearch(
  clientId: string,
  courtListenerApiKey: string,
  caseType?: string
): Promise<Response> {
  try {
    console.log(`Processing search for client ${clientId}, case type: ${caseType || 'not specified'}`);
    
    // Get case-specific information to build proper search terms
    const { searchDocument, finalCaseType } = await getSearchDocument(clientId, caseType);
    
    if (!searchDocument) {
      console.log("No suitable search document found, using fallback cases");
      return new Response(
        JSON.stringify({ 
          similarCases: getFallbackCasesByType(finalCaseType || 'general'),
          fallbackUsed: true,
          analysisFound: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate search terms based on the client's case information
    const searchTerms = generateSearchTerms(searchDocument, finalCaseType);
    console.log("Generated search terms:", searchTerms);
    
    // Query the CourtListener API for similar cases
    const courtListenerResults = await processCourtListenerResults(
      searchTerms,
      searchDocument,
      courtListenerApiKey,
      finalCaseType
    );
    
    console.log(`Found ${courtListenerResults.length} total similar cases`);
    
    return new Response(
      JSON.stringify({ 
        similarCases: courtListenerResults,
        fallbackUsed: false,
        analysisFound: true,
        caseType: finalCaseType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in handleClientSearch:", error);
    
    // If we have a case type, use it for fallback cases
    const fallbackCaseType = caseType || await identifyCaseType(clientId);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        similarCases: getFallbackCasesByType(fallbackCaseType),
        fallbackUsed: true,
        analysisFound: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get the most appropriate search document for this client
async function getSearchDocument(
  clientId: string, 
  providedCaseType?: string
): Promise<{ searchDocument: string; finalCaseType: string }> {
  // Variables to store our results
  let searchDocument = "";
  let finalCaseType = providedCaseType || "";
  
  try {
    // First try to get the legal analysis as it has the most structured case information
    const { data: analysisData, error: analysisError } = await supabase
      .from("legal_analyses")
      .select("content, case_type")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (analysisError) {
      console.error("Error fetching legal analysis:", analysisError);
    } else if (analysisData && analysisData.length > 0) {
      const analysis = analysisData[0];
      searchDocument = analysis.content || "";
      
      // Use this case type if not provided
      if (!finalCaseType && analysis.case_type) {
        finalCaseType = analysis.case_type;
      }
      
      console.log("Using legal analysis as search document");
      
      // Check if the analysis contains meaningful content
      if (searchDocument) {
        // If we have a good analysis, check if we need to refine the case type
        if (!finalCaseType) {
          const detectedType = detectCaseTypeFromText(searchDocument);
          finalCaseType = detectedType;
          console.log(`Detected case type from analysis: ${finalCaseType}`);
        }
        
        return { searchDocument, finalCaseType };
      }
    }
    
    // If no analysis, try to get client messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("client_messages")
      .select("content")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
      
    if (messagesError) {
      console.error("Error fetching client messages:", messagesError);
    } else if (messagesData && messagesData.length > 0) {
      // Combine all messages into a single document
      searchDocument = messagesData.map(msg => msg.content).join("\n\n");
      console.log("Using client messages as search document");
      
      // If still no case type, try to detect from messages
      if (!finalCaseType) {
        finalCaseType = detectCaseTypeFromText(searchDocument);
        console.log(`Detected case type from messages: ${finalCaseType}`);
      }
      
      return { searchDocument, finalCaseType };
    }
    
    // If no messages, try to get case data
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("description, case_type")
      .eq("client_id", clientId)
      .limit(1);
      
    if (caseError) {
      console.error("Error fetching case data:", caseError);
    } else if (caseData && caseData.length > 0) {
      searchDocument = caseData[0].description || "";
      console.log("Using case description as search document");
      
      // Use case type if available
      if (!finalCaseType && caseData[0].case_type) {
        finalCaseType = caseData[0].case_type;
      }
      
      // If still no case type, try to detect from case description
      if (!finalCaseType && searchDocument) {
        finalCaseType = detectCaseTypeFromText(searchDocument);
        console.log(`Detected case type from case description: ${finalCaseType}`);
      }
      
      return { searchDocument, finalCaseType };
    }
    
    // If we still don't have a case type, default to general
    if (!finalCaseType) {
      finalCaseType = "general";
      console.log("No case type detected, using general");
    }
    
    // If we got here with no search document, there's not enough client data
    if (!searchDocument) {
      console.log("No suitable search document found");
    }
    
    return { searchDocument, finalCaseType };
  } catch (error) {
    console.error("Error in getSearchDocument:", error);
    return { 
      searchDocument: "", 
      finalCaseType: finalCaseType || "general" 
    };
  }
}
