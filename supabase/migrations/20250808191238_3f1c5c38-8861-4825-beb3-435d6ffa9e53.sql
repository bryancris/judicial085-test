-- Tighten firm_case_types policies to authenticated role
DROP POLICY IF EXISTS "Firm users can view firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can view firm case types"
ON public.firm_case_types
FOR SELECT
TO authenticated
USING (firm_id = public.get_user_firm_id(auth.uid()));

DROP POLICY IF EXISTS "Firm users can insert firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can insert firm case types"
ON public.firm_case_types
FOR INSERT
TO authenticated
WITH CHECK (
  firm_id = public.get_user_firm_id(auth.uid())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "Firm users can update firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can update firm case types"
ON public.firm_case_types
FOR UPDATE
TO authenticated
USING (firm_id = public.get_user_firm_id(auth.uid()));

DROP POLICY IF EXISTS "Firm users can delete firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can delete firm case types"
ON public.firm_case_types
FOR DELETE
TO authenticated
USING (firm_id = public.get_user_firm_id(auth.uid()));