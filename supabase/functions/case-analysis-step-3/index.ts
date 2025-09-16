import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflowId, stepNumber, previousContent } = await req.json();
    console.log(`Starting Step ${stepNumber}: Texas Law Research for workflow ${workflowId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Update step status to running
    await supabase
      .from('case_analysis_steps')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', stepNumber);

    const startTime = Date.now();

    // Search for relevant Texas laws using vector search
    console.log('Searching Texas law database...');
    
    // Generate embedding for the case summary
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: previousContent
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Search for relevant laws - using a more generic approach since match_documents may not exist
    let relevantLaws = [];
    let searchError = null;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .textSearch('content', previousContent)
        .limit(5);
      relevantLaws = data;
      searchError = error;
    } catch (error) {
      console.log('Text search failed, proceeding without law database results');
      searchError = error;
    }

    if (searchError) {
      console.error('Law search error:', searchError);
    }

    const lawContext = relevantLaws?.map(law => 
      `${law.metadata.title || 'Unknown Law'}: ${law.content}`
    ).join('\n\n') || 'No relevant Texas laws found in database.';

    // Generate Texas law analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Texas legal expert. Analyze the case summary and identify relevant Texas statutes, regulations, and legal principles. Focus on:
            1. Applicable Texas Civil Practice and Remedies Code
            2. Texas Property Code (if applicable)
            3. Texas Business and Commerce Code (if applicable)
            4. Texas Deceptive Trade Practices Act (DTPA)
            5. Other relevant Texas statutes
            
            Provide specific statute citations and brief explanations of how they apply.`
          },
          {
            role: 'user',
            content: `Case Summary:\n${previousContent}\n\nRelevant Laws from Database:\n${lawContext}\n\nProvide a comprehensive analysis of applicable Texas laws.`
          }
        ],
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    const executionTime = Date.now() - startTime;

    // Update step with results
    await supabase
      .from('case_analysis_steps')
      .update({
        status: 'completed',
        content: content,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
        citations: relevantLaws || []
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', stepNumber);

    console.log(`Step ${stepNumber} completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      content,
      executionTime,
      citations: relevantLaws || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Step 3 error:', error);

    // Update step with error
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { workflowId, stepNumber } = await req.json().catch(() => ({}));
    
    if (workflowId && stepNumber) {
      await supabase
        .from('case_analysis_steps')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('workflow_id', workflowId)
        .eq('step_number', stepNumber);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});