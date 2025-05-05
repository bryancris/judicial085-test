
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, conversation } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request details for debugging
    console.log(`Generating legal analysis for client: ${clientId}`);

    // Create system prompt for legal analysis
    const systemPrompt = `
You are a law expert assistant for attorneys. Based on the client intake conversation provided, 
generate a concise legal analysis with the following sections:

1. RELEVANT TEXAS LAW: Briefly mention applicable laws in Texas that are relevant to this case.
2. ANALYSIS: Analyze the key facts from the conversation and their legal implications.
3. POTENTIAL LEGAL ISSUES: Identify potential legal challenges or considerations.
4. SUGGESTED FOLLOW-UP QUESTIONS: Recommend 2-3 specific questions the attorney should ask next to gather important information.

Format your response in Markdown with bold section headers.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the client intake conversation:\n\n${JSON.stringify(conversation)}` }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Failed to generate legal analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = data.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-legal-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
