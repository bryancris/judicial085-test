
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase clients
const getSupabaseClients = () => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  return {
    supabase: createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || ''),
    supabaseAdmin: createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '')
  };
};

// Fetch client data from database
const fetchClientData = async (supabaseAdmin: any, clientId: string) => {
  console.log(`Fetching client data for ID: ${clientId} using admin client`);
  
  try {
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId);
    
    if (clientError) {
      console.error('Error fetching client data:', clientError);
      return { clientData: null, clientError };
    }
    
    if (!clientData || clientData.length === 0) {
      console.error(`No client found with ID: ${clientId}`);
      return { clientData: null, clientError: new Error(`No client found with ID: ${clientId}`) };
    }
    
    const client = clientData[0];
    console.log(`Client data found for: ${client.first_name} ${client.last_name}`);
    
    return { clientData: client, clientError: null };
  } catch (err) {
    console.error('Unexpected error fetching client data:', err);
    return { clientData: null, clientError: err };
  }
};

// Fetch legal analysis data
const fetchLegalAnalysis = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching legal analysis for client ID: ${clientId}`);
    
    const { data: analysisData, error } = await supabaseAdmin
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching legal analysis:', error);
    }
    
    return analysisData && analysisData.length > 0 ? analysisData : [];
  } catch (err) {
    console.error('Error in fetchLegalAnalysis:', err);
    return [];
  }
};

// Fetch attorney notes
const fetchAttorneyNotes = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching attorney notes for client ID: ${clientId}`);
    
    const { data: notesData, error } = await supabaseAdmin
      .from('case_analysis_notes')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching attorney notes:', error);
    }
    
    return notesData || [];
  } catch (err) {
    console.error('Error in fetchAttorneyNotes:', err);
    return [];
  }
};

// Fetch client messages
const fetchClientMessages = async (supabaseAdmin: any, clientId: string) => {
  try {
    console.log(`Fetching client messages for client ID: ${clientId}`);
    
    const { data: messagesData, error } = await supabaseAdmin
      .from('client_messages')
      .select('content, role')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(15);
    
    if (error) {
      console.error('Error fetching client messages:', error);
    }
    
    return messagesData || [];
  } catch (err) {
    console.error('Error in fetchClientMessages:', err);
    return [];
  }
};

// Build complete context for the AI
const buildCompleteContext = (clientData: any, clientError: any, analysisData: any, notesData: any, messagesData: any) => {
  let contextText = "IMPORTANT CONTEXT - READ CAREFULLY:";
  
  // Handle client data
  if (clientError) {
    console.error('Error fetching client data:', clientError);
    contextText += "\nWARNING: Unable to fetch client details for this conversation.";
  } else if (clientData) {
    // Add prominent client identification for the attorney's reference
    contextText += `\n\nYou are assisting the attorney/paralegal with the case of CLIENT: ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `You are speaking TO the attorney/paralegal ABOUT their client ${clientData.first_name} ${clientData.last_name}.\n`;
    contextText += `Always reference the client in third person as "your client ${clientData.first_name}" or "the client ${clientData.first_name} ${clientData.last_name}".`;
    
    // Add case types if available
    if (clientData.case_types && clientData.case_types.length > 0) {
      contextText += `\n\n## CASE TYPE\n${clientData.case_types.join(", ")}`;
    }
    
    // Add client information
    contextText += `\n\n## CLIENT INFORMATION\nName: ${clientData.first_name} ${clientData.last_name}`;
    
    // Add case details
    contextText += "\n\n## CASE DETAILS";
    if (clientData.case_number) {
      contextText += `\nCase Number: ${clientData.case_number}`;
    }
    if (clientData.case_description) {
      contextText += `\n\nCase Description: ${clientData.case_description}`;
    }
    if (clientData.case_notes) {
      contextText += `\n\nCase Notes: ${clientData.case_notes}`;
    }
    
    // Add contact information
    contextText += `\nContact: ${clientData.email || 'N/A'} | ${clientData.phone || 'N/A'}`;
  } else {
    contextText += "\nWARNING: No client data available. You are unable to provide specific case advice.";
  }
  
  // Legal analysis section
  if (analysisData && analysisData.length > 0) {
    contextText += "\n\n## LEGAL ANALYSIS";
    contextText += `\n${analysisData[0].content}`;
  }
  
  // Attorney notes section
  if (notesData && notesData.length > 0) {
    contextText += "\n\n## ATTORNEY NOTES";
    notesData.forEach((note: any, index: number) => {
      contextText += `\n${index + 1}. ${note.content}`;
    });
  }
  
  // Client conversation summary
  if (messagesData && messagesData.length > 0) {
    contextText += "\n\n## CLIENT CONVERSATION SUMMARY";
    messagesData.forEach((msg: any, index: number) => {
      if (index < 15) {
        contextText += `\n${msg.role.toUpperCase()}: ${msg.content}`;
      }
    });
  }
  
  // Add specific instructions for the AI
  contextText += `\n\n## INSTRUCTIONS
1. You are assisting the ATTORNEY/PARALEGAL with case strategy and analysis. You are NOT speaking directly to the client.
2. Reference the client in third person: "your client [Name]" or "the client [Name]" - never address the client directly.
3. Provide factual legal analysis based on the case details provided above.
4. Stick to facts from case records and evidence - avoid emotional language or conjecture like "unfortunate incident."
5. When citing legal principles, be as specific as possible to the laws in the client's jurisdiction.
6. If you're unsure about any details, make it clear rather than making assumptions.
7. Maintain consistent advice between conversations to avoid contradicting earlier guidance.
8. Your goal is to help the attorney develop case strategy and prepare for proceedings.
9. IMPORTANT: Always base your responses on the case information provided, not general legal knowledge.
10. Use professional legal terminology and maintain an objective, factual tone throughout.`;
  
  // Add final explicit directive
  if (clientData) {
    contextText += `\n\nCRITICAL REMINDER: You are assisting the attorney/paralegal with ${clientData.first_name} ${clientData.last_name}'s case. Reference the client in third person and stick to factual legal analysis without emotional characterizations.`;
  }
  
  console.log("Sample of context being sent to OpenAI (first 500 chars):");
  console.log(contextText.substring(0, 500) + "...");
  
  return contextText;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, voice = 'alloy' } = await req.json();
    
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

    console.log("Creating OpenAI ephemeral session for client:", clientId, "with voice:", voice);

    // Fetch all case context data
    const { supabaseAdmin } = getSupabaseClients();
    const { clientData, clientError } = await fetchClientData(supabaseAdmin, clientId);
    const analysisData = await fetchLegalAnalysis(supabaseAdmin, clientId);
    const notesData = await fetchAttorneyNotes(supabaseAdmin, clientId);
    const messagesData = await fetchClientMessages(supabaseAdmin, clientId);

    // Build complete context
    const contextInstructions = buildCompleteContext(clientData, clientError, analysisData, notesData, messagesData);

    // Create an ephemeral session token with proper configuration
    const sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: contextInstructions,
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
    console.log("OpenAI session created successfully with case context and voice:", voice);

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
