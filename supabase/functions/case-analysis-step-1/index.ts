import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflowId, stepNumber, previousContent } = await req.json();
    
    if (!workflowId || !stepNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    console.log(`🚀 Step 1: CASE SUMMARY starting for workflow ${workflowId}`);

    // Get workflow info to retrieve clientId and caseId
    const { data: workflow, error: workflowError } = await supabase
      .from('case_analysis_workflows')
      .select('client_id, case_id')
      .eq('id', workflowId)
      .single();

    if (workflowError || !workflow) {
      throw new Error(`Failed to retrieve workflow: ${workflowError?.message}`);
    }

    const { client_id: clientId, case_id: caseId } = workflow;

    // Get client context from client messages
    const { data: clientMessages, error: messagesError } = await supabase
      .from('client_messages')
      .select('message_content')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    const existingContext = clientMessages?.map(m => m.message_content).join('\n\n') || 'No additional context provided';

    // Update step status to running
    await supabase
      .from('case_analysis_steps')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString() 
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', 1);

    // Create system prompt for Step 1 - Case Summary
    const systemPrompt = `You are a legal assistant specializing in organizing fact patterns for Texas consumer protection cases.

Your task is to create a clear, organized case summary from the provided client information and documents. Focus on:

1. KEY FACTS: Extract and organize the most important factual information
2. PARTIES INVOLVED: Identify all relevant parties (client, businesses, third parties)
3. TIMELINE: Create a chronological sequence of events
4. DAMAGES/HARM: Identify any financial losses, damages, or harm claimed
5. CONTEXT: Provide background information that may be legally relevant

Format your response as a professional case summary that will be used by other legal analysis steps.`;

    const userPrompt = `Based on the following client information and context, create a comprehensive case summary:

CLIENT CONTEXT:
${existingContext || 'No additional context provided'}

Please provide a well-organized case summary that identifies key facts, parties, timeline, and potential legal issues. Focus on factual organization rather than legal conclusions.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const executionTime = Date.now() - startTime;

    console.log(`✅ Step 1 completed in ${executionTime}ms`);

    // Update step with results
    await supabase
      .from('case_analysis_steps')
      .update({
        status: 'completed',
        content: content,
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        validation_score: 0.9
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', 1);

    // Update workflow current step
    await supabase
      .from('case_analysis_workflows')
      .update({ current_step: 2 })
      .eq('id', workflowId);

    return new Response(
      JSON.stringify({
        success: true,
        step: 1,
        stepName: 'Case Summary',
        content: content,
        executionTime: executionTime,
        nextStep: 2
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Step 1 error:', error);
    
    // Update step status to failed if we have workflowId
    try {
      const { workflowId } = await req.json();
      if (workflowId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('case_analysis_steps')
          .update({
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('workflow_id', workflowId)
          .eq('step_number', 1);
      }
    } catch (updateError) {
      console.error('Failed to update step status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        step: 1,
        stepName: 'Case Summary'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});