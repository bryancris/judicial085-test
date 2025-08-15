-- Clean up test/placeholder data from courtlistener_cases
DELETE FROM courtlistener_case_embeddings 
WHERE case_id IN (
  SELECT id FROM courtlistener_cases 
  WHERE courtlistener_id LIKE 'temp_%' 
  OR case_name LIKE '%placeholder%'
  OR case_name = 'State of Texas v. Harris County, Texas'
);

DELETE FROM courtlistener_case_concepts 
WHERE case_id IN (
  SELECT id FROM courtlistener_cases 
  WHERE courtlistener_id LIKE 'temp_%' 
  OR case_name LIKE '%placeholder%'
  OR case_name = 'State of Texas v. Harris County, Texas'
);

DELETE FROM courtlistener_case_citations 
WHERE citing_case_id IN (
  SELECT id FROM courtlistener_cases 
  WHERE courtlistener_id LIKE 'temp_%' 
  OR case_name LIKE '%placeholder%'
  OR case_name = 'State of Texas v. Harris County, Texas'
)
OR cited_case_id IN (
  SELECT id FROM courtlistener_cases 
  WHERE courtlistener_id LIKE 'temp_%' 
  OR case_name LIKE '%placeholder%'
  OR case_name = 'State of Texas v. Harris County, Texas'
);

-- Delete the actual test cases
DELETE FROM courtlistener_cases 
WHERE courtlistener_id LIKE 'temp_%' 
OR case_name LIKE '%placeholder%'
OR case_name = 'State of Texas v. Harris County, Texas';

-- Add constraints to prevent future test data insertion
ALTER TABLE courtlistener_cases 
ADD CONSTRAINT valid_courtlistener_id 
CHECK (courtlistener_id !~ '^temp_|^test_|^placeholder');

ALTER TABLE courtlistener_cases 
ADD CONSTRAINT valid_case_name 
CHECK (case_name != 'placeholder' AND case_name != 'test case' AND LENGTH(case_name) > 5);