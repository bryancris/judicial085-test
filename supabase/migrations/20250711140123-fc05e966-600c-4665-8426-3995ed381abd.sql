-- Create templates table for firm template library
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  firm_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Users can view templates from their firm
CREATE POLICY "Users can view firm templates" 
ON public.templates 
FOR SELECT 
USING (
  firm_id = get_user_firm_id(auth.uid()) OR
  user_id = auth.uid()
);

-- Users can create templates for their firm
CREATE POLICY "Users can create firm templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (firm_id = get_user_firm_id(auth.uid()) OR firm_id IS NULL)
);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" 
ON public.templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('templates', 'templates', true);

-- Create policies for template file uploads
CREATE POLICY "Users can view template files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'templates');

CREATE POLICY "Users can upload template files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own template files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own template files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();