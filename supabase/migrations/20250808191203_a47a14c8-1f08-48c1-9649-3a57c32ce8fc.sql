-- Create table for firm-specific case types
CREATE TABLE IF NOT EXISTS public.firm_case_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.firm_case_types ENABLE ROW LEVEL SECURITY;

-- Unique index to prevent duplicate slugs per firm (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS firm_case_types_firm_value_unique
  ON public.firm_case_types (firm_id, lower(value));

-- Helpful index for firm scoping
CREATE INDEX IF NOT EXISTS idx_firm_case_types_firm_id
  ON public.firm_case_types (firm_id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_firm_case_types_updated_at ON public.firm_case_types;
CREATE TRIGGER update_firm_case_types_updated_at
BEFORE UPDATE ON public.firm_case_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Policies: restrict access to current user's firm
DROP POLICY IF EXISTS "Firm users can view firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can view firm case types"
ON public.firm_case_types
FOR SELECT
USING (firm_id = public.get_user_firm_id(auth.uid()));

DROP POLICY IF EXISTS "Firm users can insert firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can insert firm case types"
ON public.firm_case_types
FOR INSERT
WITH CHECK (
  firm_id = public.get_user_firm_id(auth.uid())
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "Firm users can update firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can update firm case types"
ON public.firm_case_types
FOR UPDATE
USING (firm_id = public.get_user_firm_id(auth.uid()));

DROP POLICY IF EXISTS "Firm users can delete firm case types" ON public.firm_case_types;
CREATE POLICY "Firm users can delete firm case types"
ON public.firm_case_types
FOR DELETE
USING (firm_id = public.get_user_firm_id(auth.uid()));