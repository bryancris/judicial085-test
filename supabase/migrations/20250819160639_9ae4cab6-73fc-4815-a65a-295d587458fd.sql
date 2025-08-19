-- Clean up fake coordinator-generated analyses
DELETE FROM legal_analyses 
WHERE client_id = 'b79ba564-5313-423b-91b7-0c499997d1ae' 
AND (
  content LIKE '%Expert Testimony%' 
  OR (content LIKE '%fact-based-analysis law%' AND analysis_type = 'direct-analysis')
);