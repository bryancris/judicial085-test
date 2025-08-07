-- Delete the problematic document with wrong MIME type
-- This document has ID 1035c3e8-a422-4455-bce8-aff9f9ce4c01 and has text/plain content type instead of application/pdf

-- First delete document chunks
DELETE FROM document_chunks 
WHERE document_id = '1035c3e8-a422-4455-bce8-aff9f9ce4c01';

-- Then delete document metadata
DELETE FROM document_metadata 
WHERE id = '1035c3e8-a422-4455-bce8-aff9f9ce4c01';

-- Delete the file from storage (note: this targets the specific file path)
-- The file path should be: firm/6a433c53-eb41-4b2f-8a16-c195369160ec/1754568501837_785bporc8k.pdf
DELETE FROM storage.objects 
WHERE bucket_id = 'client_documents' 
AND name LIKE '%1754568501837_785bporc8k.pdf';