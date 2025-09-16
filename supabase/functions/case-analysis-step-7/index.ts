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
    console.log(`Starting Step ${stepNumber}: Refined Analysis for workflow ${workflowId}`);

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

    // Combine all previous step content
    const combinedContent = Object.values(allPreviousContent || {}).join('\n\n');

    // Generate refined analysis
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
            content: `You are a senior legal analyst providing a fact-driven legal requirements analysis.

            Analyze how the client's facts measure against specific legal requirements. Structure your response as:

            **EXECUTIVE SUMMARY**: Brief overview of the case and key findings

            **LEGAL REQUIREMENTS VS. CLIENT'S CASE**: 
            For each applicable legal requirement, provide:
            1. [Requirement Name]
            - Law: [Brief description of the legal requirement]
            - Citation: [Specific statutory citation]  
            - Client Facts: [How client's situation applies] → [✅ Meets requirement / ❌ Does not meet / ⚠️ Partially meets]

            **CASE CONCLUSION**: 
            - Overall Assessment: [Strong/Moderate/Weak case with factual justification]
            - Next Steps: [Specific actionable recommendations]
            - Key Strengths: [Factual advantages]
            - Potential Challenges: [Factual weaknesses]

            Be factual and objective. Use checkmarks (✅/❌/⚠️) for each requirement. Cite specific Texas statutes and provide definitive conclusions based on facts.`
          },
          {
            role: 'user',
            content: `Create a comprehensive refined analysis that synthesizes all findings:\n\n${combinedContent}`
          }
        ],
        max_tokens: 2500
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
        completed_at: new Date().toISOString()
      })
      .eq('workflow_id', workflowId)
      .eq('step_number', stepNumber);

    console.log(`Step ${stepNumber} completed in ${executionTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      content,
      executionTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Step 7 error:', error);

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