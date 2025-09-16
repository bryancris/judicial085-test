import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { clientId } = await req.json()

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🧹 Cleaning up stuck workflows for client ${clientId}`)

    // Find all running workflows for this client
    const { data: runningWorkflows, error: fetchError } = await supabase
      .from('case_analysis_workflows')
      .select('id, status, current_step, created_at')
      .eq('client_id', clientId)
      .eq('status', 'running')

    if (fetchError) {
      console.error('❌ Error fetching workflows:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch workflows' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!runningWorkflows || runningWorkflows.length === 0) {
      console.log('✅ No running workflows found to clean up')
      return new Response(
        JSON.stringify({ message: 'No running workflows found', cleaned: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📋 Found ${runningWorkflows.length} running workflows to clean up`)

    // Cancel all running workflows
    const workflowIds = runningWorkflows.map(w => w.id)
    const { data: updatedWorkflows, error: updateError } = await supabase
      .from('case_analysis_workflows')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .in('id', workflowIds)
      .select('id, status')

    if (updateError) {
      console.error('❌ Error updating workflows:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to cancel workflows' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully cancelled ${updatedWorkflows?.length || 0} workflows`)

    return new Response(
      JSON.stringify({ 
        message: 'Workflows cleaned up successfully', 
        cleaned: updatedWorkflows?.length || 0,
        workflows: updatedWorkflows 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in cleanup-workflows:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})