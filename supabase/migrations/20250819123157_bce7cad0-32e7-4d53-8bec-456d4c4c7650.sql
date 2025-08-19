
-- 1) Align the case metadata to enforce domain lock
-- David Chen's active case (from logs)
-- Case: fc113172-e100-495e-8f7a-095506c8065a
UPDATE public.cases
SET case_type = 'consumer-protection'
WHERE id = 'fc113172-e100-495e-8f7a-095506c8065a';

-- 2) Remove recent property/premises-liability analyses for this client/case to prevent contamination
-- Client: c1f379cf-7f06-475e-8a59-7b1f6632790c
DELETE FROM public.legal_analyses
WHERE client_id = 'c1f379cf-7f06-475e-8a59-7b1f6632790c'
  AND (case_id = 'fc113172-e100-495e-8f7a-095506c8065a' OR case_id IS NULL)
  AND created_at > now() - interval '48 hours'
  AND (
    lower(coalesce(case_type, '')) LIKE '%premises%'
    OR lower(coalesce(case_type, '')) LIKE '%property%'
    OR lower(content) ~* '(texas\\s+property\\s+code|trespass\\s+to\\s+try\\s+title|adverse\\s+possession|encroach|easement)'
  );
