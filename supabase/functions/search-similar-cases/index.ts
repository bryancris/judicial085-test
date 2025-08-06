import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourtListenerResult {
  id: string;
  case_name: string;
  snippet: string;
  court: string;
  date_filed: string;
  absolute_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== SEARCH SIMILAR CASES FUNCTION START ===");
    
    // Parse request body with error handling
    let clientId;
    try {
      const body = await req.json();
      clientId = body.clientId;
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Invalid request format",
        searchStrategy: "parse-error"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!clientId) {
      console.error("❌ Missing clientId in request");
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Client ID is required",
        searchStrategy: "missing-client-id"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing request for client: ${clientId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get CourtListener API key
    const courtListenerApiKey = Deno.env.get('COURTLISTENER_API_KEY');
    if (!courtListenerApiKey) {
      console.error("❌ Missing CourtListener API key");
      return new Response(JSON.stringify({
        similarCases: [],
        error: "CourtListener API key not configured",
        searchStrategy: "missing-api-key"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get client data for analysis
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error("❌ Client not found:", clientError);
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Client not found",
        searchStrategy: "client-not-found"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate search terms based on client case type and content
    let searchTerms = '';
    const caseType = clientData.case_type?.toLowerCase() || '';
    const incidentDescription = clientData.incident_description || '';
    
    if (caseType.includes('premises') || incidentDescription.toLowerCase().includes('slip') || incidentDescription.toLowerCase().includes('fall')) {
      searchTerms = '"premises liability" OR "slip and fall" OR "negligence" Texas';
    } else if (caseType.includes('consumer')) {
      searchTerms = '"DTPA" OR "consumer protection" OR "deceptive trade practices" Texas';
    } else if (caseType.includes('personal')) {
      searchTerms = '"personal injury" OR "negligence" Texas';
    } else {
      // Generic search for liability cases
      searchTerms = '"liability" OR "negligence" Texas';
    }

    console.log(`🔍 Searching CourtListener with terms: ${searchTerms}`);

    // Search CourtListener API
    try {
      const encodedQuery = encodeURIComponent(searchTerms);
      const courtListenerUrl = `https://www.courtlistener.com/api/rest/v3/search/?q=${encodedQuery}&type=o&order_by=score%20desc&stat_Published=on`;
      
      const response = await fetch(courtListenerUrl, {
        headers: {
          'Authorization': `Token ${courtListenerApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CourtListener API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const cases = data.results || [];
      
      console.log(`✅ CourtListener returned ${cases.length} results`);

      // Format results for frontend
      const formattedCases = cases.slice(0, 10).map((caseItem: any) => ({
        id: caseItem.id,
        case_name: caseItem.caseName || caseItem.case_name || 'Unknown Case',
        snippet: caseItem.snippet || 'No description available',
        court: caseItem.court || 'Unknown Court',
        date_filed: caseItem.dateFiled || caseItem.date_filed,
        absolute_url: caseItem.absolute_url,
        relevance_score: 85 // Default score for CourtListener results
      }));

      return new Response(JSON.stringify({
        similarCases: formattedCases,
        fallbackUsed: false,
        analysisFound: true,
        searchStrategy: "courtlistener-search",
        searchTerms: searchTerms,
        totalResults: cases.length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (apiError) {
      console.error("❌ CourtListener API error:", apiError);
      
      return new Response(JSON.stringify({
        similarCases: [],
        error: "Failed to search legal databases",
        searchStrategy: "api-error",
        details: apiError.message
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error("❌ Unexpected error in search similar cases:", error);
    
    return new Response(JSON.stringify({
      similarCases: [],
      error: `Unexpected error: ${error.message || "Unknown error occurred"}`,
      searchStrategy: "unexpected-error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});