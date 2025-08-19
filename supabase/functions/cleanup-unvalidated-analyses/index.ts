import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security check: require secret key
    const secretKey = req.headers.get('x-cleanup-secret');
    const expectedSecret = Deno.env.get('CLEANUP_SECRET_KEY');
    
    if (!secretKey || secretKey !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.0");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting cleanup of unvalidated analyses...');

    // Mark old unvalidated analyses as 'invalid'
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: updatedAnalyses, error: updateError } = await supabase
      .from('legal_analyses')
      .update({ validation_status: 'invalid' })
      .or('validation_status.is.null,validation_status.neq.validated')
      .lt('created_at', oneDayAgo)
      .select('id, validation_status, created_at');

    if (updateError) {
      console.error('❌ Error updating analyses:', updateError);
      return new Response(
        JSON.stringify({ error: 'Cleanup failed', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up coordinator/research analyses that shouldn't be displayed
    const { data: coordinatorAnalyses, error: coordinatorError } = await supabase
      .from('legal_analyses')
      .update({ validation_status: 'invalid' })
      .in('analysis_type', ['3-agent-coordination', 'coordinator-research'])
      .select('id, analysis_type');

    if (coordinatorError) {
      console.error('❌ Error cleaning coordinator analyses:', coordinatorError);
    }

    console.log(`✅ Cleanup completed:`);
    console.log(`- Updated ${updatedAnalyses?.length || 0} old unvalidated analyses`);
    console.log(`- Cleaned ${coordinatorAnalyses?.length || 0} coordinator analyses`);

    return new Response(
      JSON.stringify({
        success: true,
        cleaned_analyses: updatedAnalyses?.length || 0,
        coordinator_cleaned: coordinatorAnalyses?.length || 0,
        message: 'Cleanup completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error in cleanup:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});