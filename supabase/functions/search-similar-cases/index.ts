
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/corsUtils.ts";
import { intelligentCourtListenerSearch } from "./services/intelligentCourtListenerSearch.ts";
import { getIntelligentFallbackByArea, generateCourtListenerSearchUrl } from "./utils/intelligentFallbackCases.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { determineFinalCaseType } from "./utils/caseTypeDetector.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== AI-POWERED SEARCH SIMILAR CASES FUNCTION START ===");
    
    const { clientId } = await req.json();
    console.log(`Processing request for client: ${clientId}`);
    
    // Get API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const courtListenerApiKey = Deno.env.get('COURTLISTENER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`API Keys available - OpenAI: ${!!openaiApiKey}, CourtListener: ${!!courtListenerApiKey}`);
    
    if (!openaiApiKey || !courtListenerApiKey) {
      console.log("❌ Required API keys not configured");
      return new Response(JSON.stringify({
        similarCases: [],
        error: "API keys not configured for similar case search",
        searchStrategy: "missing-api-keys"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Get legal analysis content
    const { data: analysisData, error: analysisError } = await supabase
      .from("legal_analyses")
      .select("content, case_type")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);
      
    if (analysisError) {
      console.error("Error fetching legal analysis:", analysisError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: analysisError.message,
        analysisFound: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!analysisData || analysisData.length === 0) {
      console.log("❌ No legal analysis found");
      return new Response(JSON.stringify({
        similarCases: [],
        error: "No legal analysis found. Please generate a legal analysis first.",
        analysisFound: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("✅ Found legal analysis content");
    
    const analysis = analysisData[0];
    const analysisContent = analysis.content;
    
    // Get case info for stored case type
    const { data: caseData } = await supabase
      .from("cases")
      .select("case_type")
      .eq("client_id", clientId)
      .limit(1);
    
    const storedCaseType = caseData?.[0]?.case_type || null;
    console.log(`✅ Found case info, stored type: ${storedCaseType}`);
    
    // Determine final case type using our enhanced detector
    const finalCaseType = determineFinalCaseType(analysisContent, storedCaseType);
    console.log(`Detected case type: ${finalCaseType}`);
    console.log(`✅ DETECTED: ${finalCaseType} case`);
    
    // Search using intelligent AI-powered approach
    const searchResult = await intelligentCourtListenerSearch(
      analysisContent,
      finalCaseType,
      openaiApiKey,
      courtListenerApiKey
    );
    
    // NEW: If no results from CourtListener, use intelligent fallbacks
    let finalResults = searchResult.results;
    let fallbackUsed = false;
    
    if (finalResults.length === 0) {
      console.log("⚠️ No results from CourtListener, using intelligent fallbacks");
      const fallbackCases = getIntelligentFallbackByArea(finalCaseType);
      finalResults = fallbackCases.map((fallbackCase: any) => ({
        source: "courtlistener" as const,
        clientId: null,
        clientName: fallbackCase.clientName || "Similar Case",
        similarity: fallbackCase.similarity || 60,
        relevantFacts: fallbackCase.relevantFacts || "No summary available",
        outcome: fallbackCase.outcome || "Case outcome details not available",
        court: fallbackCase.court || "Unknown Court",
        citation: fallbackCase.citation || "No citation",
        dateDecided: fallbackCase.dateDecided || null,
        url: fallbackCase.url || null,
        agentReasoning: "Intelligent fallback - similar case type"
      }));
      fallbackUsed = true;
      console.log(`✅ Provided ${finalResults.length} intelligent fallback cases`);
    }
    
    // Format results for frontend and ensure all have viewable URLs
    const formattedCases = finalResults.map((result: any) => {
      const caseName = result.caseName || result.case_name || result.clientName || "Unknown Case";
      const citation = result.citation?.[0] || result.citation || "No citation";
      
      // Ensure the case has a viewable URL
      let caseUrl = result.absolute_url || result.url || null;
      if (!caseUrl || caseUrl === null) {
        // Generate a search URL if no direct URL is available
        caseUrl = generateCourtListenerSearchUrl(caseName, citation);
      }
      
      return {
        source: "courtlistener" as const,
        clientId: null,
        clientName: caseName,
        similarity: result.similarity || 50,
        relevantFacts: result.snippet || result.text || result.relevantFacts || "No summary available",
        outcome: result.outcome || `Court: ${result.court || result.court_name || "Unknown"}`,
        court: result.court || result.court_name || "Unknown Court",
        citation: citation,
        dateDecided: result.dateFiled || result.date_filed || result.dateDecided || null,
        url: caseUrl,
        agentReasoning: result.agentReasoning || "AI analysis completed"
      };
    });
    
    if (formattedCases.length === 0) {
      console.log("❌ No similar cases found despite fallback attempts");
      return new Response(JSON.stringify({
        similarCases: [],
        fallbackUsed: false,
        analysisFound: true,
        searchStrategy: "ai-agent-no-results",
        message: "No similar cases found in legal databases despite comprehensive AI analysis.",
        caseType: finalCaseType,
        searchQueries: searchResult.searchQueries,
        agentAnalysis: searchResult.agentAnalysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`✅ Found ${formattedCases.length} similar cases using ${fallbackUsed ? 'intelligent fallback' : 'AI-powered search'}`);
    
    return new Response(JSON.stringify({
      similarCases: formattedCases,
      fallbackUsed: fallbackUsed,
      analysisFound: true,
      searchStrategy: fallbackUsed ? "intelligent-fallback" : "ai-agent-powered",
      caseType: finalCaseType,
      searchQueries: searchResult.searchQueries,
      agentAnalysis: searchResult.agentAnalysis,
      message: `Found ${formattedCases.length} similar cases using ${fallbackUsed ? 'intelligent fallback system' : 'AI analysis'}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Unexpected error in search similar cases:", error);
    
    return new Response(JSON.stringify({
      similarCases: [],
      error: error.message || "An unexpected error occurred",
      fallbackUsed: false,
      analysisFound: false,
      searchStrategy: "error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
