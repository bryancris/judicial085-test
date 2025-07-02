

// Configuration and constants
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
export const getEnvVars = () => {
  const vars = {
    OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY'),
    GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY'),
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  };
  
  // Log environment status for debugging (without leaking keys)
  console.log("Environment variables status check:");
  console.log(`OPENAI_API_KEY available: ${vars.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`GEMINI_API_KEY available: ${vars.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`SUPABASE_URL available: ${vars.SUPABASE_URL ? 'Yes' : 'No'}`);
  console.log(`SUPABASE_ANON_KEY available: ${vars.SUPABASE_ANON_KEY ? 'Yes' : 'No'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY available: ${vars.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}`);
  
  return vars;
};

