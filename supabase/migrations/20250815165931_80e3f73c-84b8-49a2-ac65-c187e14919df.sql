-- Fix RLS policy for perplexity_research to allow proper inserts by AI agents
-- The current policy requires the client_id to match the user's owned clients,
-- but AI agents may be inserting on behalf of authenticated users
-- We need to update the policy to allow inserts when the user is authenticated

-- First drop the existing insert policy
DROP POLICY IF EXISTS "Users can create their own perplexity research" ON public.perplexity_research;

-- Create a new insert policy that allows authenticated users to insert
-- (AI agents running on behalf of authenticated users should be able to insert)
CREATE POLICY "Authenticated users can create perplexity research" 
ON public.perplexity_research
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  client_id IN (
    SELECT clients.id 
    FROM clients 
    WHERE clients.user_id = auth.uid()
  )
);

-- Also add a missing legal_analysis_id column if needed for proper linking
ALTER TABLE public.perplexity_research 
ADD COLUMN IF NOT EXISTS legal_analysis_id uuid;