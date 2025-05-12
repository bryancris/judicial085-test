
-- Add law_references column to legal_analyses table to store references to Texas laws
ALTER TABLE legal_analyses ADD COLUMN IF NOT EXISTS law_references JSONB DEFAULT '[]'::jsonb;
