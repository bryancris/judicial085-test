import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { documentId, documentTitle } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Document ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document chunks to get content
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('content')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (chunksError) {
      console.error('Error fetching document chunks:', chunksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch document content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No document content found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine all chunks into full content
    const fullContent = chunks.map(chunk => chunk.content).join('\n\n');
    
    // Truncate content if too long (keep first 3000 chars for review)
    const contentForReview = fullContent.length > 3000 
      ? fullContent.substring(0, 3000) + "..."
      : fullContent;

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI to review the document
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a legal AI assistant reviewing documents. Your task is to:
1. Provide a concise one-sentence summary of what this document is about
2. Ask one helpful follow-up question about how you can assist with this document

Keep your response brief and professional. Focus on the document's purpose and potential legal implications.`
          },
          {
            role: 'user',
            content: `Please review this document titled "${documentTitle || 'Untitled Document'}":\n\n${contentForReview}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReview = openaiData.choices[0]?.message?.content;

    if (!aiReview) {
      throw new Error('No response received from OpenAI');
    }

    console.log(`Document review generated for ${documentId}`);

    return new Response(
      JSON.stringify({ 
        review: aiReview,
        documentTitle: documentTitle || 'Untitled Document'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in review-uploaded-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
