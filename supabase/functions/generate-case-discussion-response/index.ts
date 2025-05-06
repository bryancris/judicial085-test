
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders, getEnvVars } from "./config.ts";
import { 
  getSupabaseClients, 
  fetchClientData, 
  fetchLegalAnalysis,
  fetchAttorneyNotes,
  fetchClientMessages,
  saveCaseDiscussion 
} from "./clientDataService.ts";
import { buildCompleteContext } from "./contextBuilder.ts";
import { formatMessages, generateOpenAiResponse } from "./openAiService.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { clientId, message, previousMessages, userId } = await req.json();

    // Log crucial parameters
    console.log(`Request received with clientId: ${clientId}`);
    console.log(`Message: ${message?.substring(0, 50)}...`);
    console.log(`Previous messages count: ${previousMessages?.length || 0}`);

    if (!clientId || !message || !userId) {
      console.error('Missing required parameters', { clientId, message: !!message, userId });
      return new Response(
        JSON.stringify({ error: 'Client ID, message, and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing case discussion for client: ${clientId}`);

    // Initialize Supabase clients
    const { supabase, supabaseAdmin } = getSupabaseClients();
    
    // Fetch all necessary data
    const { clientData, clientError } = await fetchClientData(supabase, clientId);
    
    if (clientError || !clientData) {
      console.error('Failed to fetch client data:', clientError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch client data', details: clientError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = await fetchLegalAnalysis(supabase, clientId);
    const notesData = await fetchAttorneyNotes(supabase, clientId);
    const messagesData = await fetchClientMessages(supabase, clientId);

    // Build context for AI
    const contextText = buildCompleteContext(
      clientData, 
      null, 
      analysisData, 
      notesData, 
      messagesData
    );
    
    console.log(`Context text length: ${contextText.length} characters`);

    // Format messages for OpenAI
    const messages = formatMessages(contextText, previousMessages, message);

    // Generate AI response
    const aiResponse = await generateOpenAiResponse(messages);

    // Format timestamp for consistency
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Save attorney's message
    const saveAttorneyError = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      message, 
      'attorney', 
      timestamp
    );

    // Save AI's response
    const saveAIError = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      aiResponse, 
      'ai', 
      timestamp
    );

    // Return response
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        timestamp: timestamp
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in generate-case-discussion-response:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
