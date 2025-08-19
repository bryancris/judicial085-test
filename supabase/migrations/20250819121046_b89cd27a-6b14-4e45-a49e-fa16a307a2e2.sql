-- Clean up incorrect analysis that doesn't match David Chen's case
DELETE FROM legal_analyses 
WHERE id = 'ee59bc09-abd9-4f81-883b-6c3c4e6974cf' 
  AND case_type = 'premises-liability'
  AND client_id = 'c1f379cf-7f06-475e-8a59-7b1f6632790c';