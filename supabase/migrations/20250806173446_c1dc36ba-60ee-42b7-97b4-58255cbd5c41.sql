-- Make client_id nullable in document_chunks table to support firm-level documents
ALTER TABLE public.document_chunks ALTER COLUMN client_id DROP NOT NULL;

-- Update RLS policies to handle both client-level and firm-level chunks
DROP POLICY IF EXISTS "Users can view document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can insert document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can delete document chunks" ON public.document_chunks;

-- Create new RLS policies that handle both client and firm level documents
CREATE POLICY "Users can view document chunks" 
ON public.document_chunks 
FOR SELECT 
USING (
  -- Client-level documents: user owns the client
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) 
  OR 
  -- Firm-level documents: user belongs to the firm that owns the document
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm 
    WHERE (dm.user_id = auth.uid()) 
       OR (dm.firm_id IS NOT NULL AND dm.firm_id = get_user_firm_id(auth.uid()))
  ))
);

CREATE POLICY "Users can insert document chunks" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (
  -- Client-level documents: user owns the client
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) 
  OR 
  -- Firm-level documents: user belongs to the firm that owns the document
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm 
    WHERE (dm.user_id = auth.uid()) 
       OR (dm.firm_id IS NOT NULL AND dm.firm_id = get_user_firm_id(auth.uid()))
  ))
);

CREATE POLICY "Users can delete document chunks" 
ON public.document_chunks 
FOR DELETE 
USING (
  -- Client-level documents: user owns the client
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) 
  OR 
  -- Firm-level documents: user belongs to the firm that owns the document
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm 
    WHERE (dm.user_id = auth.uid()) 
       OR (dm.firm_id IS NOT NULL AND dm.firm_id = get_user_firm_id(auth.uid()))
  ))
);