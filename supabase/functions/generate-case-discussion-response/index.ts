
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
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    // Initialize Supabase client with anon key for read operations
    const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
    
    // Initialize Supabase admin client with service role key for write operations (bypassing RLS)
    const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

    // Fetch comprehensive client information
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    // Start building a comprehensive context for the AI
    let contextText = "You are an AI legal assistant helping an attorney with a specific case. ";
    let caseTypesText = "";
    let caseDetailsText = "";
    
    // Add client information with error handling
    if (clientError) {
      console.error('Error fetching client data:', clientError);
      contextText += "\nNote: Unable to fetch client details for this conversation.";
    } else if (clientData) {
      contextText += `\nCLIENT: ${clientData.first_name} ${clientData.last_name}`;
      
      // Add case details if available
      if (clientData.case_number) {
        caseDetailsText += `\nCASE NUMBER: ${clientData.case_number}`;
      }
      
      // Add case types if available
      if (clientData.case_types && clientData.case_types.length > 0) {
        caseTypesText = `\nCASE TYPE(S): ${clientData.case_types.join(", ")}`;
      }
      
      // Add case notes if available
      if (clientData.case_notes) {
        caseDetailsText += `\nCASE NOTES: ${clientData.case_notes}`;
      }
      
      // Add address information if available
      let addressInfo = "";
      if (clientData.address) {
        addressInfo += clientData.address;
        if (clientData.city) addressInfo += `, ${clientData.city}`;
        if (clientData.state) addressInfo += `, ${clientData.state}`;
        if (clientData.zip_code) addressInfo += ` ${clientData.zip_code}`;
        
        if (addressInfo) {
          caseDetailsText += `\nCLIENT ADDRESS: ${addressInfo}`;
        }
      }
      
      // Add contact information
      caseDetailsText += `\nCONTACT: ${clientData.email} | ${clientData.phone}`;
    }

    // Fetch latest legal analysis
    const { data: analysisData } = await supabase
      .from('legal_analyses')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Fetch attorney notes for additional context
    const { data: notesData } = await supabase
      .from('case_analysis_notes')
      .select('content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    // Fetch client conversation for facts
    const { data: messagesData } = await supabase
      .from('client_messages')
      .select('content, role')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(15);
    
    // Add case types to context
    if (caseTypesText) {
      contextText += caseTypesText;
    }
    
    // Add case details to context
    if (caseDetailsText) {
      contextText += `\n\nCASE DETAILS: ${caseDetailsText}`;
    }
    
    // Extract and structure legal analysis if available
    if (analysisData && analysisData.length > 0) {
      const analysisContent = analysisData[0].content;
      
      // Try to parse and structure the legal analysis
      try {
        // Check if there are sections that can be identified
        let structuredAnalysis = "";
        
        // Extract key sections from the legal analysis text
        if (analysisContent.includes("Relevant Law")) {
          const relevantLawMatch = analysisContent.match(/Relevant Law[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
          if (relevantLawMatch && relevantLawMatch[1]) {
            structuredAnalysis += `\n\nRELEVANT LAW: ${relevantLawMatch[1].trim()}`;
          }
        }
        
        // Extract strengths and weaknesses
        const strengthsMatch = analysisContent.match(/Strengths[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
        const weaknessesMatch = analysisContent.match(/Weaknesses[:\s]+(.*?)(?=\n\n|\n[A-Z]|$)/s);
        
        if (strengthsMatch && strengthsMatch[1]) {
          structuredAnalysis += `\n\nCASE STRENGTHS: ${strengthsMatch[1].trim()}`;
        }
        
        if (weaknessesMatch && weaknessesMatch[1]) {
          structuredAnalysis += `\n\nCASE WEAKNESSES: ${weaknessesMatch[1].trim()}`;
        }
        
        // If we couldn't extract structured data, use the full analysis
        if (structuredAnalysis) {
          contextText += `\n\nLEGAL ANALYSIS:${structuredAnalysis}`;
        } else {
          contextText += `\n\nLEGAL ANALYSIS: ${analysisContent}`;
        }
      } catch (parseError) {
        // If parsing fails, use the raw analysis
        contextText += `\n\nLEGAL ANALYSIS: ${analysisContent}`;
      }
    } else {
      contextText += "\n\nNote: No legal analysis has been generated for this case yet.";
    }

    // Add attorney notes if available
    if (notesData && notesData.length > 0) {
      contextText += "\n\nATTORNEY NOTES:";
      notesData.forEach((note, index) => {
        contextText += `\n${index + 1}. ${note.content}`;
      });
    }

    // Extract key facts from client conversation
    if (messagesData && messagesData.length > 0) {
      contextText += "\n\nCLIENT CONVERSATION SUMMARY:";
      messagesData.forEach((msg: any, index) => {
        if (index < 15) { // Limit to avoid token overflow
          contextText += `\n${msg.role}: ${msg.content}`;
        }
      });
    }

    // Add specific instructions for the AI
    contextText += `\n\nINSTRUCTIONS:
1. You are discussing THIS SPECIFIC CASE with the attorney. Reference case details in your responses.
2. Provide thoughtful legal analysis based on the case details provided above.
3. When citing legal principles, be as specific as possible to the laws in the client's jurisdiction.
4. If you're unsure about any details, make it clear rather than making assumptions.
5. Maintain consistent advice between conversations to avoid contradicting earlier guidance.
6. Your goal is to help the attorney develop case strategy and prepare for proceedings.`;

    // Format messages for OpenAI
    const messages = [
      {
        role: "system",
        content: contextText
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

    // Save attorney's message using admin client (bypasses RLS)
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const { error: saveAttorneyError } = await supabaseAdmin
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

    // Save AI's response using admin client (bypasses RLS)
    const { error: saveAIError } = await supabaseAdmin
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
