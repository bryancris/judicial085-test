import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    console.log(`🧹 Cleaning up stuck workflows for client ${clientId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Find stuck workflows (running for more than 30 minutes)
    const { data: stuckWorkflows, error: findError } = await supabase
      .from('case_analysis_workflows')
      .select('id, created_at, status')
      .eq('client_id', clientId)
      .eq('status', 'running')
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 minutes ago

    if (findError) {
      console.error('❌ Error finding stuck workflows:', findError);
      throw findError;
    }

    console.log(`📋 Found ${stuckWorkflows?.length || 0} stuck workflows to clean up`);

    if (stuckWorkflows && stuckWorkflows.length > 0) {
      // Mark stuck workflows as failed
      const { error: updateError } = await supabase
        .from('case_analysis_workflows')
        .update({
          status: 'failed',
          error_message: 'Workflow stuck - cleaned up by system',
          completed_at: new Date().toISOString()
        })
        .in('id', stuckWorkflows.map(w => w.id));

      if (updateError) {
        console.error('❌ Error updating stuck workflows:', updateError);
        throw updateError;
      }

      console.log(`✅ Cleaned up ${stuckWorkflows.length} stuck workflows`);
    }

    return new Response(JSON.stringify({
      success: true,
      cleanedUp: stuckWorkflows?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});