-- Fix critical RLS security issues for the tables that don't have RLS enabled

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on document_rows table  
ALTER TABLE public.document_rows ENABLE ROW LEVEL SECURITY;

-- Enable RLS on n8n_chat_histories table
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for documents table (restrict access to authenticated users only)
CREATE POLICY "Authenticated users can view documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create basic RLS policies for document_rows table (restrict access to authenticated users only)
CREATE POLICY "Authenticated users can view document_rows" 
ON public.document_rows 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert document_rows" 
ON public.document_rows 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create basic RLS policies for n8n_chat_histories table (restrict access to authenticated users only)
CREATE POLICY "Authenticated users can view n8n_chat_histories" 
ON public.n8n_chat_histories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert n8n_chat_histories" 
ON public.n8n_chat_histories 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);