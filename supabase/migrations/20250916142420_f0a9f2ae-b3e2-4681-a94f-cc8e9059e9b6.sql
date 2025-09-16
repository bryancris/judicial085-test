-- Clean up stuck workflows by marking them as cancelled
UPDATE case_analysis_workflows 
SET status = 'cancelled', 
    completed_at = now(), 
    error_message = 'Cancelled due to infinite loop bug'
WHERE status IN ('running', 'pending') 
  AND created_at > now() - interval '1 hour';

-- Clean up stuck workflow steps
UPDATE case_analysis_steps 
SET status = 'cancelled', 
    completed_at = now(), 
    error_message = 'Cancelled due to infinite loop bug'
WHERE status IN ('running', 'pending') 
  AND created_at > now() - interval '1 hour';