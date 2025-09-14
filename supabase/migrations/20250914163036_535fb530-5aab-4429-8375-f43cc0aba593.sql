-- Add unique constraint to pi_case_metrics for client_id to support upsert operations
ALTER TABLE pi_case_metrics 
ADD CONSTRAINT pi_case_metrics_client_id_unique UNIQUE (client_id);