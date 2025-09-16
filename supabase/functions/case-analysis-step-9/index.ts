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
    const { workflowId, stepNumber, allPreviousContent } = await req.json();
    console.log(`Starting Step ${stepNumber}: Law References Compilation for workflow ${workflowId}`);

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

    // Get all citations from previous steps
    const { data: stepData, error: stepError } = await supabase
      .from('case_analysis_steps')
      .select('citations')
      .eq('workflow_id', workflowId)
      .not('citations', 'is', null);

    if (stepError) {
      console.error('Error fetching step citations:', stepError);
    }

    // Combine all citations
    const allCitations = stepData?.reduce((acc, step) => {
      if (step.citations && Array.isArray(step.citations)) {
        return [...acc, ...step.citations];
      }
      return acc;
    }, []) || [];

    // Combine all previous step content
    const combinedContent = Object.values(allPreviousContent || {}).join('\n\n');

    // Generate comprehensive law references
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
            content: `You are a legal research expert creating a comprehensive law reference compilation.

            Create a well-organized reference list including:

            **PRIMARY AUTHORITIES**:
            - Relevant statutes with full citations
            - Constitutional provisions (if applicable)
            - Regulations and administrative rules

            **SECONDARY AUTHORITIES**:
            - Case law with proper citations
            - Legal treatises and practice guides
            - Law review articles (if highly relevant)

            **RESEARCH NOTES**:
            - Brief explanations of how each source applies
            - Hierarchy of authority considerations
            - Additional research suggestions

            Format all citations properly according to legal citation standards. 
            Organize by relevance and authority level.`
          },
          {
            role: 'user',
            content: `Create a comprehensive law reference compilation based on this analysis:\n\n${combinedContent}\n\nCitations found: ${JSON.stringify(allCitations, null, 2)}`
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
        citations: allCitations
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', stepNumber);

    // Update workflow as completed
    await supabase
      .from('case_analysis_workflows')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', workflowId);

    console.log(`Step ${stepNumber} completed in ${executionTime}ms - Workflow Complete!`);

    return new Response(JSON.stringify({
      success: true,
      content,
      executionTime,
      citations: allCitations,
      workflowCompleted: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Step 9 error:', error);

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

      // Mark workflow as failed
      await supabase
        .from('case_analysis_workflows')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', workflowId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});