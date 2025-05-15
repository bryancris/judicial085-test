
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./corsUtils.ts";
import { buildCompleteContext } from "./contextBuilders/index.ts";
import { generateOpenAIResponse } from "./openAiService.ts";
import { supabase } from "./supabaseClient.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, message, previousMessages } = await req.json();
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    // Fetch contracts associated with client (if we implement contract upload later)
    const { data: contractsData } = await supabase
      .from('contract_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('role', 'attorney')
      .order('created_at', { ascending: true });

    // Get contract review history for context
    const { data: contractReviewHistory } = await supabase
      .from('contract_reviews')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(50);

    // Build context based on all available data
    const contextText = buildCompleteContext(
      clientData,
      clientError,
      contractsData || [],
      contractReviewHistory || [],
      message
    );

    console.log("Generating contract review response for client:", clientId);

    // Generate AI response using context
    const aiResponse = await generateOpenAIResponse(contextText, message);

    return new Response(
      JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-contract-review-response:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        response: "I apologize, but I encountered an error analyzing your contract. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
