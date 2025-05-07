
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
import { buildCompleteContext } from "./contextBuilders/index.ts";
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
    console.log(`User ID: ${userId || 'not provided'}`);

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
    
    // Fetch client data using admin client to bypass RLS
    const { clientData, clientError } = await fetchClientData(supabaseAdmin, clientId);
    
    if (clientError || !clientData) {
      console.error('Error fetching client data:', clientError);
      
      // Return a graceful error response 
      return new Response(
        JSON.stringify({ 
          response: "I'm sorry, I couldn't access this client's information. Please check if the client exists or try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: clientError ? clientError.message : 'Client data not found'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use admin client for all data fetching to bypass RLS restrictions
    const analysisData = await fetchLegalAnalysis(supabaseAdmin, clientId);
    const notesData = await fetchAttorneyNotes(supabaseAdmin, clientId);
    const messagesData = await fetchClientMessages(supabaseAdmin, clientId);

    // Build context for AI
    const contextText = buildCompleteContext(
      clientData, 
      clientError, 
      analysisData, 
      notesData, 
      messagesData
    );
    
    console.log(`Context text length: ${contextText.length} characters`);
    console.log('First 200 characters of context:', contextText.substring(0, 200));

    // Format messages for OpenAI
    const messages = formatMessages(contextText, previousMessages, message);

    // Generate AI response
    const aiResponse = await generateOpenAiResponse(messages);

    // Format timestamp for consistency
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Save attorney's message using admin client
    const saveAttorneyError = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      message, 
      'attorney', 
      timestamp
    );

    if (saveAttorneyError) {
      console.warn('Non-critical error saving attorney message:', saveAttorneyError);
    }

    // Save AI's response using admin client
    const saveAIError = await saveCaseDiscussion(
      supabaseAdmin, 
      clientId, 
      userId, 
      aiResponse, 
      'ai', 
      timestamp
    );

    if (saveAIError) {
      console.warn('Non-critical error saving AI response:', saveAIError);
    }

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
    // Return a user-friendly error message
    return new Response(
      JSON.stringify({ 
        response: "I'm sorry, I encountered an unexpected error. Please try again or contact support if the issue persists.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: error.message
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
