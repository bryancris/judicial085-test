-- Cleanup mismatched real-estate analyses contaminating David Chen's DTPA/consumer case
-- Target: client c1f379cf-7f06-475e-8a59-7b1f6632790c
-- Remove specific known bad records and any property/premises analyses created today

-- Explicit IDs observed in logs (if present)
DELETE FROM public.legal_analyses
WHERE id IN (
  '0426b230-7e53-45ac-8470-5c355bd773da',
  '19dbc64e-c544-4f4f-ab0a-91d1f59deffa',
  'ee59bc09-abd9-4f81-883b-6c3c4e6974cf'
)
AND client_id = 'c1f379cf-7f06-475e-8a59-7b1f6632790c';

-- Safety sweep: delete analyses for this client created in the last 24h that look like property/premises
DELETE FROM public.legal_analyses
WHERE client_id = 'c1f379cf-7f06-475e-8a59-7b1f6632790c'
  AND created_at > now() - interval '24 hours'
  AND (
    lower(coalesce(case_type, '')) LIKE '%premises%'
    OR lower(coalesce(case_type, '')) LIKE '%property%'
    OR lower(content) ~* '(texas\s+property\s+code|trespass\s+to\s+try\s+title|adverse\s+possession|encroach|easement)'
  );