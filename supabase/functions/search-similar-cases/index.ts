
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";
import { corsHeaders } from "./utils/corsUtils.ts";
import { handleAdaptiveClientSearch } from "./handlers/adaptiveClientSearchHandler.ts";
import { getFallbackCasesByType } from "./utils/fallbackCases.ts";

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
    console.log(`=== ADAPTIVE SIMILAR CASES SEARCH for client: ${clientId} ===`);
    
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    
    // Use the new adaptive search handler that analyzes case content with AI
    return await handleAdaptiveClientSearch(clientId, courtListenerApiKey);
    
  } catch (error) {
    console.error('Error in adaptive search-similar-cases function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to search for similar cases',
        similarCases: getFallbackCasesByType("general"),
        fallbackUsed: true,
        analysisFound: false,
        searchStrategy: "error-fallback"
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
