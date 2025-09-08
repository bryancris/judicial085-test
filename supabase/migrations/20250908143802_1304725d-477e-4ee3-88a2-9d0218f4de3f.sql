
-- Step 1: Replace the overly strict SELECT policy on public.legal_analyses

-- Drop the existing SELECT policy that only allows row owner visibility
DROP POLICY IF EXISTS "Users can view their own legal analyses" ON public.legal_analyses;

-- Create a broader, still-safe SELECT policy:
-- - super_admins
-- - the row owner
-- - the user who owns the related client
-- - users in the same firm as the client
CREATE POLICY "Users can view analyses for their clients or firm"
ON public.legal_analyses
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR auth.uid() = user_id
  OR client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = legal_analyses.client_id
      AND c.firm_id IS NOT NULL
      AND c.firm_id = get_user_firm_id(auth.uid())
  )
);
