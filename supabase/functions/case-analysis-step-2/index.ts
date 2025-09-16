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
    const requestBody = await req.json();
    console.log('🔍 Step 2 received parameters:', JSON.stringify(requestBody, null, 2));
    
    const { workflowId, stepNumber, previousContent } = requestBody;
    
    console.log(`📋 Parsed parameters - workflowId: ${workflowId}, stepNumber: ${stepNumber}`);
    console.log(`📄 previousContent type: ${typeof previousContent}, length: ${previousContent?.length || 0}`);
    console.log(`📝 previousContent preview: ${previousContent?.substring(0, 200)}...`);
    
    // Additional debugging for Step 2 specific issues
    console.log('🔧 Step 2 DEBUG INFO:');
    console.log(`   - Has previousContent: ${!!previousContent}`);
    console.log(`   - previousContent is string: ${typeof previousContent === 'string'}`);
    console.log(`   - previousContent trimmed length: ${previousContent?.trim?.()?.length || 0}`);
    
    if (previousContent) {
      console.log(`   - First 100 chars: ${previousContent.substring(0, 100)}`);
      console.log(`   - Contains case info: ${previousContent.includes('Case') ? 'YES' : 'NO'}`);
    }
    
    if (!workflowId || !stepNumber) {
      console.error('❌ Missing required parameters:', { workflowId, stepNumber });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: workflowId or stepNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!previousContent || previousContent.trim().length === 0) {
      console.error('❌ Missing or empty previousContent:', { previousContent });
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: previousContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    console.log(`🚀 Step 2: PRELIMINARY ANALYSIS starting for workflow ${workflowId}`);

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

    // Update step status to running
    await supabase
      .from('case_analysis_steps')
      .update({ 
        status: 'running', 
        started_at: new Date().toISOString() 
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', 2);

    // Create system prompt for Step 2 - Preliminary Analysis
    const systemPrompt = `You are a legal assistant specializing in preliminary legal issue identification for Texas consumer protection cases.

Your task is to analyze the case summary and identify potential legal issues, causes of action, and areas requiring further research. Focus on:

1. POTENTIAL CAUSES OF ACTION: Identify possible legal claims
2. LEGAL THEORIES: Suggest applicable legal frameworks
3. JURISDICTIONAL ISSUES: Note relevant courts and jurisdictions
4. EVIDENCE NEEDS: Identify what evidence may be required
5. PRELIMINARY RESEARCH AREAS: Suggest specific laws/regulations to research

This is preliminary analysis - avoid making definitive legal conclusions. Focus on issue spotting and research direction.`;

    const userPrompt = `Based on the following case summary from Step 1, conduct a preliminary legal analysis:

CASE SUMMARY:
${previousContent}

Please identify potential legal issues, causes of action, and areas requiring further legal research. Focus on issue spotting rather than conclusions.`;

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
        max_tokens: 2500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const executionTime = Date.now() - startTime;

    console.log(`✅ Step 2 completed in ${executionTime}ms`);

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
      .eq('step_number', 2);

    // Update workflow current step
    await supabase
      .from('case_analysis_workflows')
      .update({ current_step: 3 })
      .eq('id', workflowId);

    return new Response(
      JSON.stringify({
        success: true,
        step: 2,
        stepName: 'Preliminary Analysis',
        content: content,
        executionTime: executionTime,
        nextStep: 3
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Step 2 error:', error);
    
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
          .eq('step_number', 2);
      }
    } catch (updateError) {
      console.error('Failed to update step status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        step: 2,
        stepName: 'Preliminary Analysis'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});