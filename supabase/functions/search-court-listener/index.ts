import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CourtListenerResult {
  id: number;
  caseName: string;
  court: string;
  dateFiled: string;
  docketNumber?: string;
  snippet: string;
  absolute_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, citation } = await req.json();
    
    console.log("=== COURTLISTENER DEBUG START ===");
    console.log("Searching Court Listener for:", { query, citation });

    // Get CourtListener API token from environment
    const courtListenerToken = Deno.env.get('COURTLISTENER_API_TOKEN');
    
    if (!courtListenerToken) {
      console.error("CourtListener API token not configured");
      return new Response(
        JSON.stringify({ 
          error: "CourtListener API not configured",
          results: []
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("API Token configured:", courtListenerToken ? `Token present (${courtListenerToken.substring(0, 8)}...)` : "NO TOKEN");

    // Court Listener API endpoint for search - using V4
    const searchUrl = new URL("https://www.courtlistener.com/api/rest/v4/search/");
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("type", "o"); // opinions
    searchUrl.searchParams.append("order_by", "score desc");

    console.log("Making request to URL:", searchUrl.toString());
    console.log("Request headers:", {
      'Authorization': `Token ${courtListenerToken.substring(0, 8)}...`,
      'User-Agent': 'Legal Research Application/1.0 (contact@yourfirm.com)',
      'Accept': 'application/json',
    });

    console.log("About to make fetch request...");
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Token ${courtListenerToken}`,
        'User-Agent': 'Legal Research Application/1.0 (contact@yourfirm.com)',
        'Accept': 'application/json',
      },
    });

    console.log("Fetch completed. Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error("Court Listener API error:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `Court Listener API error: ${response.status} - ${response.statusText}`,
          results: [],
          needsAuth: response.status === 403 || response.status === 401
        }), 
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log("Court Listener raw response:", data);

    // Transform the results to our expected format (V4 API response structure)
    const results: CourtListenerResult[] = (data.results || []).slice(0, 5).map((item: any) => ({
      id: item.cluster_id || item.id,
      caseName: item.caseName || item.caseNameFull || "Unknown Case",
      court: item.court || "Unknown Court",
      dateFiled: item.dateFiled || "Unknown Date",
      docketNumber: item.docketNumber || "Unknown Docket",
      snippet: "", // V4 doesn't include snippet in search results
      absolute_url: item.absolute_url ? `https://www.courtlistener.com${item.absolute_url}` : `https://www.courtlistener.com/opinion/${item.cluster_id || item.id}/`
    }));

    console.log("Processed Court Listener results:", results.length);

    return new Response(
      JSON.stringify({ 
        results,
        count: results.length,
        source: "CourtListener"
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in Court Listener search:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        results: []
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});