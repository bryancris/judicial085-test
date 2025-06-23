
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Create Supabase client with service role key for admin operations
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client for user verification
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated and get their session
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is super admin
    const { data: userRole, error: roleError } = await supabaseAnon
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !userRole) {
      return new Response(JSON.stringify({ error: 'Access denied. Super admin role required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { first_name, last_name, email, phone, role, firm_id, password } = await req.json();

    console.log('Creating user with data:', { first_name, last_name, email, role, firm_id });

    // Create the user account using service role
    const { data: authData, error: authCreateError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      }
    });

    if (authCreateError) {
      console.error('Auth creation error:', authCreateError);
      throw new Error(`Failed to create user account: ${authCreateError.message}`);
    }

    if (!authData.user) {
      throw new Error("Failed to create user - no user returned");
    }

    console.log('User created successfully:', authData.user.id);

    // Update the user's profile
    const { error: profileError } = await supabaseServiceRole
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name,
        last_name,
        email,
        phone: phone || null,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    console.log('Profile created successfully');

    // Assign role
    const { error: roleInsertError } = await supabaseServiceRole
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role,
      });

    if (roleInsertError) {
      console.error('Role assignment error:', roleInsertError);
      throw new Error(`Failed to assign role: ${roleInsertError.message}`);
    }

    console.log('Role assigned successfully');

    // Associate with firm
    const { error: firmError } = await supabaseServiceRole
      .from('firm_users')
      .insert({
        user_id: authData.user.id,
        firm_id,
        is_active: true,
      });

    if (firmError) {
      console.error('Firm association error:', firmError);
      throw new Error(`Failed to associate with firm: ${firmError.message}`);
    }

    console.log('Firm association created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
