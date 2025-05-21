
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";
import { corsHeaders } from "./utils/corsUtils.ts";
import { handleClientSearch } from "./handlers/clientSearchHandler.ts";
import { getFallbackCasesByType } from "./utils/fallbackCases.ts";
import { identifyCaseType } from "./utils/caseTypeDetector.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const courtListenerApiKey = Deno.env.get('COURTLISTENER_API_KEY') || '76ddb006469713cde169d7d8a2907ca5ff600b3a';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    console.log(`Searching for similar cases to client ID: ${clientId}`);
    
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    
    // Detect the case type for this client to provide better search results
    const caseType = await identifyCaseType(clientId);
    console.log(`Final case type for search: ${caseType}`);
    
    // Handle the client search request with the detected case type
    return await handleClientSearch(clientId, courtListenerApiKey, caseType);
    
  } catch (error) {
    console.error('Error in search-similar-cases function:', error);
    
    // Attempt to get a meaningful case type even if the process failed
    let fallbackType = "general-liability";
    try {
      // Extract client ID from the error if possible
      const clientIdMatch = error.message?.match(/client ID: ([a-zA-Z0-9-]+)/);
      const clientId = clientIdMatch ? clientIdMatch[1] : null;
      
      if (clientId) {
        fallbackType = await identifyCaseType(clientId);
      }
    } catch (innerError) {
      console.error("Error getting fallback case type:", innerError);
    }
    
    console.log(`Using fallback case type: ${fallbackType} due to error`);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to search for similar cases',
        similarCases: getFallbackCasesByType(fallbackType),
        fallbackUsed: true,
        analysisFound: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
