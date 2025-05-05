
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
      console.error('OpenAI API key is not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the request details for debugging
    console.log(`Generating legal analysis for client: ${clientId}`);
    console.log(`Conversation length: ${conversation.length}`);

    // Create improved system prompt for legal analysis
    const systemPrompt = `
You are a legal expert assistant for attorneys in Texas. Based on the attorney-client conversation provided, 
generate a concise legal analysis with the following sections:

1. **RELEVANT TEXAS LAW:** Identify and briefly explain Texas laws, statutes, or precedents that apply to this case.

2. **PRELIMINARY ANALYSIS:** Analyze the key facts from the conversation and their legal implications under Texas law.

3. **POTENTIAL LEGAL ISSUES:** Identify potential legal challenges, considerations, or defenses that may arise.

4. **RECOMMENDED FOLLOW-UP QUESTIONS:** Suggest 3-5 specific questions the attorney should ask next to gather important information for the case.

Format your response in Markdown with bold section headers. Always format the follow-up questions as a numbered list (e.g., "1. Question text") under the "RECOMMENDED FOLLOW-UP QUESTIONS" header.
`;

    // Format the conversation for the API request
    const formattedConversation = conversation.map(msg => ({
      role: "user", 
      content: `${msg.role.toUpperCase()}: ${msg.content}`
    }));

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Here is the attorney-client conversation for analysis:\n\n" + formattedConversation.map(msg => msg.content).join("\n\n") }
    ];

    console.log("Sending request to OpenAI with messages:", JSON.stringify(messages));

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
        max_tokens: 1200,
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
    console.log("Legal analysis generated successfully");

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
