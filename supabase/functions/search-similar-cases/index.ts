
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";
import { LegalCaseAgent } from "./services/legalCaseAgent.ts";
import { IntelligentCourtListenerSearch } from "./services/intelligentCourtListenerSearch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';
const courtListenerApiKey = Deno.env.get('COURTLISTENER_API_KEY') || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple case type detection focused on HOA/Property Law
const detectCaseType = (content: string): string => {
  console.log("=== CASE TYPE DETECTION START ===");
  const lowerContent = content.toLowerCase();
  
  // Check for HOA/Property indicators with high priority
  if (lowerContent.includes("209.006") || lowerContent.includes("209.007")) {
    console.log("✅ DETECTED: property-law case (specific statutes)");
    return "property-law";
  }
  
  if (lowerContent.includes("homeowners") || lowerContent.includes("homeowner") ||
      lowerContent.includes("hoa") || lowerContent.includes("property code")) {
    console.log("✅ DETECTED: property-law case (general terms)");
    return "property-law";
  }
  
  // Check for DTPA/Consumer Protection
  if (lowerContent.includes("dtpa") || lowerContent.includes("deceptive trade")) {
    console.log("✅ DETECTED: consumer-protection case");
    return "consumer-protection";
  }
  
  console.log("✅ DETECTED: general case");
  return "general";
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== AI-POWERED SEARCH SIMILAR CASES FUNCTION START ===");
    const { clientId } = await req.json();
    console.log(`Processing request for client: ${clientId}`);
    
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Check if required API keys are available
    const hasOpenAI = openaiApiKey && openaiApiKey.length > 0;
    const hasCourtListener = courtListenerApiKey && courtListenerApiKey.length > 0;
    
    console.log(`API Keys available - OpenAI: ${hasOpenAI}, CourtListener: ${hasCourtListener}`);
    
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
      console.log("✅ Found legal analysis content");
    }

    if (cases && cases.length > 0) {
      storedCaseType = cases[0].case_type;
      const caseInfo = [cases[0].case_description, cases[0].case_notes]
        .filter(Boolean)
        .join(' ');
      if (caseInfo) {
        analysisContent += '\n\n' + caseInfo;
      }
      console.log(`✅ Found case info, stored type: ${storedCaseType}`);
    }

    if (!analysisContent) {
      console.log("❌ No analysis content found - cannot search for similar cases");
      return new Response(
        JSON.stringify({
          similarCases: [],
          fallbackUsed: false,
          analysisFound: false,
          searchStrategy: "no-analysis",
          message: "No legal analysis found. Please generate a legal analysis first to enable similar case search."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect case type from analysis content
    const detectedCaseType = detectCaseType(analysisContent);
    console.log(`Detected case type: ${detectedCaseType}`);

    // Only proceed if we have both OpenAI and CourtListener API keys
    if (!hasOpenAI || !hasCourtListener) {
      console.log("❌ Missing required API keys for search");
      return new Response(
        JSON.stringify({
          similarCases: [],
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "missing-api-keys",
          message: "API keys not configured. Similar case search requires both OpenAI and CourtListener API access.",
          caseType: detectedCaseType
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("🤖 USING AI AGENT-POWERED SEARCH");
    
    let agent: LegalCaseAgent | null = null;
    try {
      agent = new LegalCaseAgent(openaiApiKey);
      
      // Step 1: Analyze the case with AI agent
      console.log("Step 1: Analyzing case with AI agent...");
      const agentAnalysis = await agent.analyzeCaseForSimilarity(analysisContent, detectedCaseType);
      console.log("Agent analysis complete:", {
        legalConcepts: agentAnalysis.legalConcepts.length,
        keyFacts: agentAnalysis.keyFacts.length,
        searchQueries: agentAnalysis.searchQueries.length
      });

      let searchResults: any[] = [];

      // Step 2: Use CourtListener API if analysis generated queries
      if (agentAnalysis.searchQueries.length > 0) {
        console.log("Step 2: Searching CourtListener with agent queries...");
        const courtSearch = new IntelligentCourtListenerSearch(courtListenerApiKey);
        const courtResults = await courtSearch.searchWithAgentQueries(agentAnalysis);
        
        // Convert to our expected format and validate URLs
        searchResults = courtResults
          .filter(result => result.absoluteUrl && result.absoluteUrl.startsWith('http'))
          .map(result => ({
            source: "courtlistener",
            clientId: null,
            clientName: result.caseName,
            similarity: 0.85, // Will be scored by agent
            relevantFacts: result.relevantFacts || result.snippet,
            outcome: result.outcome || "Case outcome details not available",
            court: result.court,
            citation: result.citation,
            dateDecided: result.dateFiled ? new Date(result.dateFiled).toLocaleDateString() : "Unknown date",
            url: result.absoluteUrl.startsWith('http') ? result.absoluteUrl : `https://www.courtlistener.com${result.absoluteUrl}`
          }));
        
        console.log(`Found ${searchResults.length} validated cases from CourtListener`);
      } else {
        console.log("❌ Agent analysis did not generate search queries");
      }

      // Step 3: Score and rank results with AI agent if we have results
      if (searchResults.length > 0) {
        console.log("Step 3: Scoring results with AI agent...");
        const scoredCases = await agent.scoreCaseRelevance(analysisContent, searchResults);
        
        // Filter for high relevance (score > 60) and update similarity scores
        const relevantCases = scoredCases
          .filter(scored => scored.relevanceScore > 60)
          .map(scored => ({
            ...scored.case,
            similarity: scored.relevanceScore,
            agentReasoning: scored.reasoning
          }))
          .slice(0, 8); // Limit to top 8 results

        console.log(`Agent scored ${relevantCases.length} cases as highly relevant`);

        if (relevantCases.length > 0) {
          return new Response(
            JSON.stringify({
              similarCases: relevantCases,
              fallbackUsed: false,
              analysisFound: true,
              searchStrategy: "ai-agent-powered",
              caseType: detectedCaseType,
              agentAnalysis: {
                legalConcepts: agentAnalysis.legalConcepts.slice(0, 5),
                caseTheory: agentAnalysis.caseTheory
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // No results found - return empty with clear message
      console.log("No similar cases found in legal databases");
      
      return new Response(
        JSON.stringify({
          similarCases: [],
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "no-results-found",
          caseType: detectedCaseType,
          message: "No similar cases found in available legal databases. This may indicate a unique legal situation or that similar cases have not been digitized.",
          agentAnalysis: {
            legalConcepts: agentAnalysis.legalConcepts.slice(0, 5),
            caseTheory: agentAnalysis.caseTheory
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (agentError) {
      console.error("Error in AI agent search:", agentError);
      
      // Return empty results with error information
      return new Response(
        JSON.stringify({
          similarCases: [],
          fallbackUsed: false,
          analysisFound: true,
          searchStrategy: "search-error",
          caseType: detectedCaseType,
          message: "Unable to search for similar cases due to a technical issue. Please try again later.",
          error: agentError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      // Clean up the agent
      if (agent) {
        try {
          await agent.cleanup();
        } catch (cleanupError) {
          console.error("Error cleaning up agent:", cleanupError);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in search-similar-cases function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to search for similar cases',
        similarCases: [],
        fallbackUsed: false,
        analysisFound: false,
        searchStrategy: "error",
        message: "An error occurred while searching for similar cases. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
