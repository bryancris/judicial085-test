-- Set up scheduled background enrichment jobs

-- Schedule daily enrichment job (runs at 2 AM UTC every day)
SELECT cron.schedule(
  'daily-case-enrichment',
  '0 2 * * *', -- Every day at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/enrich-global-cases',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwMTI2MiwiZXhwIjoyMDYxNzc3MjYyfQ.wjpPr1WLLnE1JhkxYTlqgbJSQaY1bshAJf06t0eBJms"}'::jsonb,
        body:=concat('{"operation": "all", "batchSize": 50, "scheduledRun": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule hourly maintenance job (runs every hour to check for high-priority cases)
SELECT cron.schedule(
  'hourly-priority-enrichment',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
        url:='https://ghpljdgecjmhkwkfctgy.supabase.co/functions/v1/enrich-global-cases',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGxqZGdlY2ptaGt3a2ZjdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjIwMTI2MiwiZXhwIjoyMDYxNzc3MjYyfQ.wjpPr1WLLnE1JhkxYTlqgbJSQaY1bshAJf06t0eBJms"}'::jsonb,
        body:=concat('{"operation": "embeddings", "batchSize": 10, "scheduledRun": true, "priority": "high", "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create a function to clean up old job runs (keep only last 100)
CREATE OR REPLACE FUNCTION cleanup_old_job_runs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete job runs older than 30 days, keeping at least the 100 most recent
  WITH old_jobs AS (
    SELECT id
    FROM background_job_runs
    WHERE created_at < NOW() - INTERVAL '30 days'
      AND id NOT IN (
        SELECT id
        FROM background_job_runs
        ORDER BY created_at DESC
        LIMIT 100
      )
  )
  DELETE FROM background_job_runs
  WHERE id IN (SELECT id FROM old_jobs);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Schedule weekly cleanup job (runs every Sunday at 3 AM UTC)
SELECT cron.schedule(
  'weekly-job-cleanup',
  '0 3 * * 0', -- Every Sunday at 3 AM UTC
  $$
  SELECT cleanup_old_job_runs() as deleted_count;
  $$
);