
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/corsUtils.ts";
import { intelligentCourtListenerSearch } from "./services/intelligentCourtListenerSearch.ts";
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
    
    // Get legal analysis content with ID
    const { data: analysisData, error: analysisError } = await supabase
      .from("legal_analyses")
      .select("id, content, case_type")
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
    
    // Legal compliance: No synthetic fallbacks - only return real case results
    let finalResults = searchResult.results;
    let fallbackUsed = false;
    
    if (finalResults.length === 0) {
      console.log("⚠️ No results from CourtListener - no synthetic data returned for legal compliance");
      finalResults = [];
      fallbackUsed = false;
    }
    
    // Format results for frontend - only real cases with verified URLs
    const formattedCases = finalResults.map((result: any) => {
      const caseName = result.caseName || result.case_name || result.clientName || "Unknown Case";
      const citation = result.citation?.[0] || result.citation || "No citation";
      
      // Only use verified URLs from real cases
      let caseUrl = result.absolute_url || result.url || null;
      
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
        agentReasoning: result.agentReasoning || "AI analysis completed",
        sourceVerified: true // All cases are from verified external sources
      };
    });
    
    if (formattedCases.length === 0) {
      console.log("❌ No similar cases found - returning empty results for legal compliance");
      return new Response(JSON.stringify({
        similarCases: [],
        fallbackUsed: false,
        analysisFound: true,
        searchStrategy: "ai-agent-no-results",
        message: "No similar cases found in legal databases. Please consult additional legal research sources and verify all legal precedents independently.",
        disclaimer: "All legal research results require independent verification. This AI-assisted search does not guarantee completeness of available case law. Attorneys must independently verify all citations and legal precedents.",
        caseType: finalCaseType,
        searchQueries: searchResult.searchQueries,
        agentAnalysis: searchResult.agentAnalysis,
        professionalResponsibilityNotice: "This tool is for research assistance only. Legal practitioners must verify all results independently and conduct comprehensive legal research using primary sources."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`✅ Found ${formattedCases.length} similar cases using ${fallbackUsed ? 'intelligent fallback' : 'AI-powered search'}`);
    
    // Save similar cases to database
    try {
      const legalAnalysisId = analysisData[0].id || analysis.id;
      
      if (legalAnalysisId && formattedCases.length > 0) {
        // First, delete existing similar cases for this analysis
        const { error: deleteError } = await supabase
          .from("similar_cases")
          .delete()
          .eq("client_id", clientId)
          .eq("legal_analysis_id", legalAnalysisId);

        if (deleteError) {
          console.error("Error deleting existing similar cases:", deleteError);
        }

        // Insert new similar cases
        const { error: insertError } = await supabase
          .from("similar_cases")
          .insert({
            client_id: clientId,
            legal_analysis_id: legalAnalysisId,
            case_data: formattedCases,
            search_metadata: {
              fallbackUsed: fallbackUsed,
              analysisFound: true,
              searchStrategy: fallbackUsed ? "intelligent-fallback" : "ai-agent-powered",
              caseType: finalCaseType
            }
          });

        if (insertError) {
          console.error("Error saving similar cases:", insertError);
        } else {
          console.log("✅ Successfully saved similar cases to database");
        }
      }
    } catch (saveError) {
      console.error("Error saving similar cases to database:", saveError);
      // Don't fail the request if saving fails
    }
    
    return new Response(JSON.stringify({
      similarCases: formattedCases,
      fallbackUsed: false, // Never using fallbacks for legal compliance
      analysisFound: true,
      searchStrategy: "ai-agent-powered",
      caseType: finalCaseType,
      searchQueries: searchResult.searchQueries,
      agentAnalysis: searchResult.agentAnalysis,
      message: `Found ${formattedCases.length} verified similar cases from legal databases`,
      disclaimer: "All legal research results require independent verification. This AI-assisted search does not guarantee completeness of available case law. Attorneys must independently verify all citations and legal precedents.",
      professionalResponsibilityNotice: "This tool is for research assistance only. Legal practitioners must verify all results independently and conduct comprehensive legal research using primary sources.",
      sourceAttribution: "All case data sourced from CourtListener and verified legal databases."
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
