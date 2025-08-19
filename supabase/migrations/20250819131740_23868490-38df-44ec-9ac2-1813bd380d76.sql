-- Clean up David Chen's misclassified analyses
-- First, let's see what we have for this client
SELECT id, content, case_type, created_at 
FROM legal_analyses 
WHERE client_id = '3d2a08a4-6e95-4735-9a8a-2c9a9df567ec'
ORDER BY created_at DESC 
LIMIT 5;

-- Delete analyses that were generated with incorrect domain locking 
-- (looking for generic content or wrong case types)
DELETE FROM legal_analyses 
WHERE client_id = '3d2a08a4-6e95-4735-9a8a-2c9a9df567ec'
  AND (
    case_type = 'test_case_type' 
    OR case_type = 'premises-liability'
    OR case_type = 'real-estate'
    OR content ILIKE '%premises liability%'
    OR content ILIKE '%real estate%'
    OR content ILIKE '%general law%'
    OR content ILIKE '%no specific texas statutes%'
    OR content ILIKE '%no specific legal issue%'
  )
  AND created_at > NOW() - INTERVAL '7 days'; -- Only recent misclassified ones

-- Add case_id column to perplexity_research if it doesn't exist
ALTER TABLE perplexity_research 
ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_perplexity_research_case_id 
ON perplexity_research(case_id);

-- Clean up any research that was saved with wrong domain constraints
DELETE FROM perplexity_research 
WHERE client_id = '3d2a08a4-6e95-4735-9a8a-2c9a9df567ec'
  AND (
    content ILIKE '%premises liability%'
    OR content ILIKE '%real estate%'
    OR metadata->>'domainHint' IN ('premises-liability', 'real-estate')
  )
  AND created_at > NOW() - INTERVAL '7 days';