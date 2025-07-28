-- Phase 1: Database Schema Updates for Quick Consult Document Upload

-- Add firm_id and user_id columns to document_metadata table
ALTER TABLE public.document_metadata 
ADD COLUMN IF NOT EXISTS firm_id uuid,
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update RLS policies to handle firm-level document access
DROP POLICY IF EXISTS "Users can insert document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can update their own document metadata" ON public.document_metadata;
DROP POLICY IF EXISTS "Users can view their own document metadata" ON public.document_metadata;

-- New RLS policies for client documents and firm documents
CREATE POLICY "Users can insert client document metadata" 
ON public.document_metadata 
FOR INSERT 
WITH CHECK (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_metadata.client_id
  )) OR
  (client_id IS NULL AND auth.uid() = user_id AND (firm_id IS NULL OR firm_id = get_user_firm_id(auth.uid())))
);

CREATE POLICY "Users can view client document metadata" 
ON public.document_metadata 
FOR SELECT 
USING (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_metadata.client_id
  )) OR
  (client_id IS NULL AND auth.uid() = user_id) OR
  (client_id IS NULL AND firm_id IS NOT NULL AND firm_id = get_user_firm_id(auth.uid()))
);

CREATE POLICY "Users can update client document metadata" 
ON public.document_metadata 
FOR UPDATE 
USING (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_metadata.client_id
  )) OR
  (client_id IS NULL AND auth.uid() = user_id)
);

-- Allow deletion of document metadata
CREATE POLICY "Users can delete their own document metadata" 
ON public.document_metadata 
FOR DELETE 
USING (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_metadata.client_id
  )) OR
  (client_id IS NULL AND auth.uid() = user_id)
);

-- Update document_chunks table policies for firm documents
DROP POLICY IF EXISTS "Users can insert their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can view their own document chunks" ON public.document_chunks;

CREATE POLICY "Users can insert document chunks" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) OR
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm WHERE dm.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can view document chunks" 
ON public.document_chunks 
FOR SELECT 
USING (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) OR
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm 
    WHERE dm.user_id = auth.uid() OR (dm.firm_id IS NOT NULL AND dm.firm_id = get_user_firm_id(auth.uid()))
  ))
);

-- Allow deletion of document chunks
CREATE POLICY "Users can delete document chunks" 
ON public.document_chunks 
FOR DELETE 
USING (
  (client_id IS NOT NULL AND auth.uid() IN (
    SELECT clients.user_id FROM clients WHERE clients.id = document_chunks.client_id
  )) OR
  (client_id IS NULL AND document_id IN (
    SELECT dm.id FROM document_metadata dm WHERE dm.user_id = auth.uid()
  ))
);