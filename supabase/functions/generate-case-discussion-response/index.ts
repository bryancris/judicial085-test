
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { clientId, message, previousMessages, userId } = await req.json();

    if (!clientId || !message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Client ID, message, and user ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

    // Fetch client information
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    // Construct context even if client fetch fails
    let contextText = "You are an AI legal assistant helping an attorney with a case. ";
    
    if (clientError) {
      console.error('Error fetching client data:', clientError);
      contextText += "\nNote: Unable to fetch specific client details for this conversation.";
    } else if (clientData) {
      contextText += `\nClient: ${clientData.first_name} ${clientData.last_name}.`;
    }

    // Fetch case analysis
    const { data: analysisData } = await supabase
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Fetch previous client messages for context
    const { data: messagesData } = await supabase
      .from('client_messages')
      .select('content, role')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (analysisData && analysisData.length > 0) {
      contextText += `\nLegal analysis of this case: ${analysisData[0].content}`;
    }

    if (messagesData && messagesData.length > 0) {
      contextText += "\nClient conversation summary:";
      messagesData.forEach((msg: any) => {
        contextText += `\n${msg.role}: ${msg.content}`;
      });
    }

    // Format messages for OpenAI
    const messages = [
      {
        role: "system",
        content: contextText + "\nProvide thoughtful legal analysis and strategic advice based on the case details."
      }
    ];

    // Add previous case discussion messages
    if (previousMessages && previousMessages.length > 0) {
      previousMessages.forEach((msg: any) => {
        messages.push({
          role: msg.role === "attorney" ? "user" : "assistant",
          content: msg.content
        });
      });
    }

    // Add the current message
    messages.push({
      role: "user",
      content: message
    });

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        max_tokens: 1000
      })
    });

    const openAIData = await openAIResponse.json();

    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error('OpenAI API error:', openAIData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = openAIData.choices[0].message.content;

    // Save attorney's message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { error: saveAttorneyError } = await supabase
      .from('case_discussions')
      .insert({
        client_id: clientId,
        user_id: userId,
        content: message,
        role: 'attorney',
        timestamp: timestamp
      });

    if (saveAttorneyError) {
      console.error('Error saving attorney message:', saveAttorneyError);
    }

    // Save AI's response
    const { error: saveAIError } = await supabase
      .from('case_discussions')
      .insert({
        client_id: clientId,
        user_id: userId,
        content: aiResponse,
        role: 'ai',
        timestamp: timestamp
      });

    if (saveAIError) {
      console.error('Error saving AI message:', saveAIError);
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
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
