
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    
    if (!clientId) {
      return new Response("Client ID required", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log("Creating OpenAI ephemeral session for client:", clientId);

    // Create an ephemeral session token with proper configuration
    const sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `You are an expert legal AI assistant helping attorneys with case discussions. You have access to client information and case documents. 

Key guidelines:
- Provide thoughtful legal analysis and strategic advice
- Reference relevant laws, precedents, and legal principles
- Ask clarifying questions to better understand the case
- Maintain attorney-client privilege and confidentiality
- Be direct and professional in your responses
- Always acknowledge the specific case context when responding

Current client ID: ${clientId}. You should reference the client's case details in your responses.`,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        tools: [
          {
            type: "function",
            name: "search_case_documents",
            description: "Search through the client's case documents for relevant information",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query for case documents" }
              },
              required: ["query"]
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.7,
        max_response_output_tokens: "inf"
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("Failed to create OpenAI session:", sessionResponse.status, errorText);
      throw new Error(`OpenAI session creation failed: ${sessionResponse.status} ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log("OpenAI session created successfully");

    if (!sessionData.client_secret?.value) {
      throw new Error("No ephemeral token received from OpenAI");
    }

    return new Response(JSON.stringify(sessionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error generating voice token:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
