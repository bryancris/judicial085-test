-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to get cases that need enrichment
CREATE OR REPLACE FUNCTION get_cases_needing_enrichment(
  batch_size INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  courtlistener_id TEXT,
  case_name TEXT,
  snippet TEXT,
  api_fetch_count INTEGER,
  last_updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.courtlistener_id,
    c.case_name,
    c.snippet,
    c.api_fetch_count,
    c.last_updated_at
  FROM courtlistener_cases c
  LEFT JOIN courtlistener_case_embeddings e ON c.id = e.case_id
  WHERE 
    -- Prioritize cases without embeddings
    (e.id IS NULL AND c.snippet IS NOT NULL)
    OR 
    -- Or cases that haven't been updated recently and have low fetch count
    (c.last_updated_at < NOW() - INTERVAL '30 days' AND c.api_fetch_count < 3)
    OR
    -- Or cases with no concepts extracted
    (NOT EXISTS (
      SELECT 1 FROM courtlistener_case_concepts cc 
      WHERE cc.case_id = c.id
    ) AND c.snippet IS NOT NULL)
  ORDER BY 
    -- Prioritize by missing embeddings, then by staleness
    CASE WHEN e.id IS NULL THEN 1 ELSE 2 END,
    c.last_updated_at ASC,
    c.api_fetch_count ASC
  LIMIT batch_size;
END;
$$;

-- Create a function to mark cases as being processed
CREATE OR REPLACE FUNCTION mark_case_processing_status(
  case_id_param UUID,
  status TEXT DEFAULT 'processing'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the case with processing metadata
  UPDATE courtlistener_cases 
  SET 
    last_updated_at = NOW(),
    api_fetch_count = api_fetch_count + 1
  WHERE id = case_id_param;
  
  RETURN FOUND;
END;
$$;

-- Create a function to get enrichment statistics
CREATE OR REPLACE FUNCTION get_enrichment_stats()
RETURNS TABLE(
  total_cases BIGINT,
  cases_with_embeddings BIGINT,
  cases_with_concepts BIGINT,
  cases_needing_enrichment BIGINT,
  last_enrichment_run TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM courtlistener_cases) as total_cases,
    (SELECT COUNT(DISTINCT case_id) FROM courtlistener_case_embeddings) as cases_with_embeddings,
    (SELECT COUNT(DISTINCT case_id) FROM courtlistener_case_concepts) as cases_with_concepts,
    (SELECT COUNT(*) FROM get_cases_needing_enrichment(1000)) as cases_needing_enrichment,
    (SELECT MAX(created_at) FROM courtlistener_case_embeddings) as last_enrichment_run;
END;
$$;

-- Create a table to track background job runs
CREATE TABLE IF NOT EXISTS background_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  processed_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on background job runs
ALTER TABLE background_job_runs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage job runs
CREATE POLICY "Service can manage background job runs"
ON background_job_runs
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_background_job_runs_job_name ON background_job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_background_job_runs_started_at ON background_job_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_background_job_runs_status ON background_job_runs(status);

-- Create a function to log job runs
CREATE OR REPLACE FUNCTION log_background_job_start(
  job_name_param TEXT,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  job_run_id UUID;
BEGIN
  INSERT INTO background_job_runs (job_name, metadata)
  VALUES (job_name_param, metadata_param)
  RETURNING id INTO job_run_id;
  
  RETURN job_run_id;
END;
$$;

-- Create a function to complete job runs
CREATE OR REPLACE FUNCTION log_background_job_complete(
  job_run_id_param UUID,
  status_param TEXT DEFAULT 'completed',
  processed_count_param INTEGER DEFAULT 0,
  error_count_param INTEGER DEFAULT 0,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE background_job_runs
  SET 
    completed_at = NOW(),
    status = status_param,
    processed_count = processed_count_param,
    error_count = error_count_param,
    metadata = metadata_param
  WHERE id = job_run_id_param;
  
  RETURN FOUND;
END;
$$;