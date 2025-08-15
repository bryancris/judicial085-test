-- Add missing columns to legal_analyses for 3-agent coordination saves
ALTER TABLE public.legal_analyses
  ADD COLUMN IF NOT EXISTS analysis_type text,
  ADD COLUMN IF NOT EXISTS research_updates jsonb DEFAULT '[]'::jsonb;
