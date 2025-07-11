-- Fix existing legal analyses with incorrect case type
UPDATE legal_analyses 
SET case_type = 'premises-liability' 
WHERE case_type = 'animal-protection' 
AND (
  content ILIKE '%slip%' OR 
  content ILIKE '%fall%' OR 
  content ILIKE '%cvs%' OR 
  content ILIKE '%premises%' OR
  content ILIKE '%retail%' OR
  content ILIKE '%store%' OR
  content ILIKE '%floor%' OR
  content ILIKE '%hazard%' OR
  content ILIKE '%unsafe condition%'
);

-- Clear all existing scholarly references that have wrong case type detection
DELETE FROM scholarly_references 
WHERE search_metadata->>'query' LIKE '%animal%' 
   OR search_metadata->>'query' LIKE '%pet%' 
   OR search_metadata->>'query' LIKE '%boarding%';