-- Clean up existing empty sessions
DELETE FROM public.quick_consult_sessions 
WHERE id NOT IN (
  SELECT DISTINCT session_id 
  FROM public.quick_consult_messages
);