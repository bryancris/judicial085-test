import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const STEP_NAMES = [
  'Case Summary',
  'Preliminary Analysis', 
  'Texas Laws',
  'Case Law Research',
  'IRAC Analysis',
  'Strengths & Weaknesses',
  'Refined Analysis',
  'Follow-up Questions',
  'Law References'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, clientId, caseId, workflowId } = await req.json();
    
    if (!action || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'create_workflow') {
      console.log(`🚀 Creating new workflow for client ${clientId}`);
      
      // Validate clientId
      if (!clientId || typeof clientId !== 'string') {
        throw new Error('Invalid client ID provided');
      }
      
      // Check if client exists in the clients table
      const { data: clientExists, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .single();
        
      if (clientError || !clientExists) {
        throw new Error('Client not found in database');
      }
      
      console.log(`✅ Client ${clientId} verified, creating workflow...`);
      
      // Create workflow record
      const { data: workflow, error: workflowError } = await supabase
        .from('case_analysis_workflows')
        .insert({
          client_id: clientId,
          case_id: caseId,
          status: 'running',
          current_step: 1,
          total_steps: 9,
          started_at: new Date().toISOString(),
          metadata: {
            created_by: 'step-based-analysis-v1',
            case_type: 'deceptive_trade'
          }
        })
        .select()
        .single();

      if (workflowError) {
        console.error('❌ Workflow creation error:', workflowError);
        throw new Error(`Failed to create workflow: ${workflowError.message}`);
      }

      // Create step records
      const stepInserts = STEP_NAMES.map((stepName, index) => ({
        workflow_id: workflow.id,
        step_number: index + 1,
        step_name: stepName,
        status: 'pending'
      }));

      const { error: stepsError } = await supabase
        .from('case_analysis_steps')
        .insert(stepInserts);

      if (stepsError) {
        throw new Error(`Failed to create steps: ${stepsError.message}`);
      }

      console.log(`✅ Created workflow ${workflow.id} with 9 steps`);

      return new Response(
        JSON.stringify({
          success: true,
          workflowId: workflow.id,
          currentStep: 1,
          totalSteps: 9,
          status: 'running'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get_workflow_status') {
      if (!workflowId) {
        return new Response(
          JSON.stringify({ error: 'workflowId required for status check' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get workflow and steps
      const { data: workflow, error: workflowError } = await supabase
        .from('case_analysis_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) {
        throw new Error(`Failed to get workflow: ${workflowError.message}`);
      }

      const { data: steps, error: stepsError } = await supabase
        .from('case_analysis_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_number');

      if (stepsError) {
        throw new Error(`Failed to get steps: ${stepsError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          workflow: workflow,
          steps: steps,
          currentStep: workflow.current_step,
          totalSteps: workflow.total_steps,
          status: workflow.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'complete_workflow') {
      if (!workflowId) {
        return new Response(
          JSON.stringify({ error: 'workflowId required for completion' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update workflow status to completed
      const { error: updateError } = await supabase
        .from('case_analysis_workflows')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          current_step: 9
        })
        .eq('id', workflowId);

      if (updateError) {
        throw new Error(`Failed to complete workflow: ${updateError.message}`);
      }

      console.log(`✅ Completed workflow ${workflowId}`);

      return new Response(
        JSON.stringify({
          success: true,
          workflowId: workflowId,
          status: 'completed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Workflow manager error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});